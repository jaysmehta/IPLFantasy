






const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 4000;
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10,
});

let db, teamsCollection;
let teams = [];
let lastScoredMatches = new Set();

// MongoDB functions
async function connectDb() {
  if (!uri) throw new Error('MONGODB_URI required');
  console.log('MongoDB connecting...');
  await client.connect();
  db = client.db('iplfantasy2026');
  teamsCollection = db.collection('teams');
  app.locals.db = db;
  app.locals.teamsCollection = teamsCollection;
  await loadTeamsFromDb();
}

async function loadTeamsFromDb() {
  teams = await teamsCollection
    .find({})
    .sort({ points: -1, lastScoredAt: -1 })
    .toArray();
  app.locals.teams = teams;
}

async function saveTeamToDb(team) {
  await teamsCollection.updateOne(
    { id: team.id },
    { $set: { ...team, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

async function deleteTeamFromDb(id) {
  await teamsCollection.deleteOne({ id });
}

connectDb().catch(console.error);

const CRICAPI_KEY = process.env.CRICAPI_KEY;

app.use(cors());
app.use(express.json());

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Status (unchanged)
app.get('/status', async (req, res) => {
  await loadTeamsFromDb();
  const scoringResult = await autoScoreRecentMatches();
  res.json({
    status: 'ok',
    teamsCount: teams.length,
    autoScoring: `${scoringResult.updatedTeams} teams updated`,
    cricapi: CRICAPI_KEY ? 'Active' : 'Missing',
    leaderboardTop: teams[0]?.points || 0,
  });
});

// NEW: Squad endpoint
app.get('/api/match_squad', async (req, res) => {
  const { matchId, team } = req.query;
  if (!CRICAPI_KEY) return res.status(503).json({ error: 'CricAPI key required' });
  if (!matchId) return res.status(400).json({ error: 'matchId required' });

  try {
    // Use fantasySquad endpoint
    console.log("calling squad API");
    const squadResponse = await axios.get('https://api.cricapi.com/v1/match_squad', {
      params: { apikey: CRICAPI_KEY, id : matchId },
      timeout: 10000,
    });
    let squadData = squadResponse.data.data;
    console.log("received response for squad API",squadResponse);

    // Fallback to match details if no fantasySquad
    // if (!squadData || !squadData.squad) {
    //   console.log("calling fallback squad API");
    //   const matchRes = await axios.get(`https://api.cricapi.com/v1/match_squad`, {
    //     params: { apikey: CRICAPI_KEY, id : matchId },
    //   timeout: 10000,
    //   });
    //   squadData = { squad: [{ players: matchRes.data.players || [] }] };
    // }

    console.log("received response for squad API",squadData);
    // Filter for specific team if requested
    let players = squadData[0]?.players || [];  // Team 1: data[0]
if (team === '2') {
  players = squadData[1]?.players || players;  // Team 2: data[1]
}

    // Standardize player format
    players = players.map(p => ({
      pid: p.pid || p.id,
      name: p.name || p.short_name,
      short_name: p.short_name || p.name.split(' ').slice(-2).join(' '),
      credit: p.credit,
      role: p.role || p.type || 'ALL',
    }));

    res.json({ players });
  } catch (error) {
    console.error('Squad error:', error.message);
    console.log("Error Squad",error.message);
    res.status(503).json({ error: 'Squad unavailable', details: error.message });
  }
});

// Teams endpoint (unchanged)
app.get('/api/teams', async (req, res) => {
  await loadTeamsFromDb();
  res.json(teams);
});

app.post('/api/teams', async (req, res) => {
  const { ownerName, teamName, match, players } = req.body;
  if (!Array.isArray(players) || players.length !== 11) {
    return res.status(400).json({ error: 'Exactly 11 players required' });
  }
  const team = {
    id: Date.now().toString(),
    ownerName: ownerName?.trim() || 'Anonymous',
    teamName: teamName?.trim() || 'My XI',
    match: match || 'Practice',
    players: players.slice(0, 11).map(p => p.trim()),
    points: 0,
    playerStats: {},
    createdAt: new Date().toISOString(),
    updatedAt: null,
    lastScoredAt: null,
  };
  await saveTeamToDb(team);
  await loadTeamsFromDb();
  res.status(201).json(team);
});

// Single team (unchanged)
app.get('/api/teams/:id', async (req, res) => {
  const team = teams.find(t => t.id === req.params.id);
  res.status(team ? 200 : 404).json(team || { error: 'Not found' });
});

app.delete('/api/teams/:id', async (req, res) => {
  await deleteTeamFromDb(req.params.id);
  await loadTeamsFromDb();
  res.json({ message: 'Deleted' });
});

// Matches (ENHANCED for team1/team2)
app.get('/api/matches', async (req, res) => {
  try {
    if (!CRICAPI_KEY) return res.status(503).json({ error: 'CricAPI key required' });
    const response = await axios.get('https://api.cricapi.com/v1/cricscore', {
      params: { apikey: CRICAPI_KEY },
      timeout: 10000,
    });
    let matches = [];
    if (Array.isArray(response.data?.data)) matches = response.data.data;
    else if (Array.isArray(response.data)) matches = response.data;

    // Filter IPL 2026 + standardize
    const iplMatches = matches
      .filter(m => 
        m?.series?.includes('Indian Premier League') ||
        ['CSK', 'MI', 'RCB', 'KKR', 'SRH', 'DC', 'LSG', 'PBKS', 'RR', 'GT'].some(team => 
          (m.t1s?.includes(team) || m.t2s?.includes(team) || m.t1?.includes(team) || m.t2?.includes(team))
        )
      )
      .map(m => ({
        id: m.id,
        name: `${m.t1 || m.team1} vs ${m.t2 || m.team2}`,
        matchType: m.matchType || 't20',
        status: m.status,
        venue: m.venue || 'TBD',
        dateTimeGMT: m.dateTimeGMT,
        team1: m.t1 || m.team_info?.[0]?.name || m.teams?.[0] || '',
        team2: m.t2 || m.team_info?.[1]?.name || m.teams?.[1] || '',
        series: { id: 'ipl-2026', name: 'Indian Premier League 2026' },
        fantasyEnabled: true,
        matchStarted: m.ms === 'live',
        matchEnded: !!m.statusSummary?.includes('Complete'),
      }))
      .sort((a, b) => new Date(b.dateTimeGMT) - new Date(a.dateTimeGMT));

    console.log(`eCricScore IPL: ${iplMatches.length} matches (chronological)`);
    res.json(iplMatches.slice(0, 25)); // Limit for dropdown
  } catch (error) {
    console.error('eCricScore error:', error.message);
    res.status(503).json({ error: 'Matches unavailable' });
  }
});

// Auto-scoring (unchanged)
async function autoScoreRecentMatches() {
  let updatedTeams = 0;
  if (!CRICAPI_KEY) {
    console.log('No CRICAPI_KEY - skipping auto-score');
    return { updatedTeams: 0 };
  }
  try {
    console.log('Checking recent IPL matches...');
    const matchesResponse = await axios.get('https://api.cricapi.com/v1/matches', {
      params: { apikey: CRICAPI_KEY, limit: 20 },
      timeout: 10000,
    });
    const matchesData = Array.isArray(matchesResponse.data)
      ? matchesResponse.data
      : Array.isArray(matchesResponse.data?.data)
      ? matchesResponse.data.data
      : [];
    const recentIplMatches = matchesData.filter(m =>
      (m.series?.name?.toLowerCase().includes('ipl') ||
       m.name?.toLowerCase().includes('ipl')) &&
      m.matchEnded &&
      m.statusSummary?.includes('Complete')
    );
    console.log(`Found ${recentIplMatches.length} IPL matches`);
    // Process last 3 completed matches
    for (const match of recentIplMatches.slice(0, 3)) {
      if (lastScoredMatches.has(match.id)) continue;
      console.log(`Scoring ${match.name} (${match.id})`);
      try {
        const matchResponse = await axios.get(`https://api.cricapi.com/v1/match/${match.id}`, {
          params: { apikey: CRICAPI_KEY },
          timeout: 8000,
        });
        const matchData = matchResponse.data;
        if (!matchData.matchEnded || !matchData.type?.includes('Complete')) continue;
        const matchTeams = teams.filter(t => t.match === match.id);
        console.log(`Scoring ${matchTeams.length} teams for ${match.name}...`);
        for (const team of matchTeams) {
          const playerStats = getPlayerStats(team.players, matchData);
          const totalPoints = calculateFantasyPoints(team.players, playerStats);
          if (totalPoints !== team.points) {
            team.points = totalPoints;
            team.playerStats = playerStats;
            team.lastScoredAt = new Date().toISOString();
            await saveTeamToDb(team);
          }
        }
        updatedTeams++;
        lastScoredMatches.add(match.id);
      } catch (matchErr) {
        console.error(`Match ${match.id} error:`, matchErr.message);
      }
    }
    await loadTeamsFromDb();
  } catch (err) {
    console.error('Auto-score failed:', err.message);
  }
  return { updatedTeams };
}

// Scoring functions (unchanged)
function getPlayerStats(players, matchData) {
  const stats = {};
  players.forEach(playerName => {
    const s = { runs: 0, wickets: 0, fours: 0, sixes: 0, catches: 0 };
    const clean = playerName.toLowerCase().split(' ')[0].trim();
    const player = matchData?.players?.find(p =>
      p?.name?.toLowerCase().includes(clean) ||
      clean.includes(p?.name?.toLowerCase())
    );
    if (player) {
      s.runs = player.runs || 0;
      s.wickets = player.wickets || 0;
      s.fours = player.fours || 0;
      s.sixes = player.sixes || 0;
      s.catches = player.catches || 0;
    }
    stats[playerName] = s;
  });
  return stats;
}

function calculateFantasyPoints(players, stats) {
  let total = 0;
  players.forEach(name => {
    const s = stats[name];
    let pts = s.runs + s.fours + (s.sixes * 2) + (s.wickets * 25) + (s.catches * 8);
    if (s.runs >= 50) pts += 10;
    if (s.wickets >= 3) pts += 5;
    // Captain/VC bonus (if marked in name)
    if (name.toLowerCase().includes('c')) pts *= 2;
    else if (name.toLowerCase().includes('vc')) pts *= 1.5;
    total += Math.floor(pts);
  });
  return total;
}

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
}















