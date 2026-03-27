// // server.js - Complete IPL 2026 Fantasy League Backend
// // --- MONGODB SETUP (replace teams.json) ---
// const { MongoClient } = require("mongodb");



// let db, teamsCollection;
// let teams = [];

// async function connectDb() {
//   console.log("✅ MongoDB connect call");
//   await client.connect();
//   db = client.db("iplfantasy2026");
//   teamsCollection = db.collection("teams");
//   console.log("✅ MongoDB connected");
//   initializeData();
// }

// async function loadTeamsFromDb() {
//   const cursor = teamsCollection.find({});
//   teams = await cursor.toArray();
//   console.log("Success",teams);
// }

// async function saveTeamToDb(team) {
//   if (!teamsCollection) {
//     console.error("MongoDB teamsCollection is not ready yet");
//     throw new Error("Database not connected");
//   }
//   await teamsCollection.updateOne(
//     { id: team.id },
//     { $set: team },
//     { upsert: true }
//   );
// }

// async function deleteTeamFromDb(id) {

// if (!teamsCollection) {
//     console.error("MongoDB teamsCollection is not ready yet");
//     throw new Error("Database not connected");
//   }
//   await teamsCollection.deleteOne({ id });

// }

// // Call this once when the server starts
// // connectDb().catch(console.error);


// // Replace your old loadTeams / saveTeams:
// async function initializeData() {
//   await loadTeamsFromDb();
//   console.log(`📊 Loaded ${teams.length} teams from MongoDB`);
// }

// async function saveTeams() {
//   // optional: bulk insert / update if you prefer
//   for (const t of teams) {
//     await saveTeamToDb(t);
//   }
// }
// // --- MONGODB SETUP END ---




// const express = require("express");
// const cors = require("cors");
// const fs = require("fs/promises");
// const path = require("path");
// const axios = require("axios");

// const app = express();
// const PORT = process.env.PORT || 4000;
// const DATA_FILE = path.join(__dirname, "teams.json");

// // ⚠️ REPLACE WITH YOUR CricAPI KEY (free at cricapi.com)
// const CRICAPI_KEY = process.env.CRICAPI_KEY || "e18c70fc-6fe7-4a3c-94c4-f4241f69ab1f";

// // Middleware
// app.use(cors());
// app.use(express.json());



// // CricAPI: Live/upcoming IPL matches
// async function getIPLMatches() {
//   try {
//     const res = await axios.get("https://api.cricapi.com/v1/matches", {
//       params: { apikey: CRICAPI_KEY, offset: 0, limit: 20 }
//     });
    
//     return res.data.data?.filter(match => 
//       match.series?.name?.includes("IPL") || 
//       match.series?.name?.includes("Indian Premier League") ||
//       match.name?.includes("IPL")
//     ) || [];
//   } catch (err) {
//     console.error("CricAPI matches error:", err.message);
//     return [];
//   }
// }

// // CricAPI: Live match details
// async function getMatchScore(matchId) {
//   try {
//     const res = await axios.get(`https://api.cricapi.com/v1/match/${matchId}`, {
//       params: { apikey: CRICAPI_KEY }
//     });
//     return res.data;
//   } catch (err) {
//     console.error("CricAPI match error:", err.message);
//     return null;
//   }
// }

// // 🆕 Get player stats (CricAPI + smart fallback)
// async function getPlayerStats(players, matchData) {
//   const stats = {};
  
//   if (matchData?.players) {
//     players.forEach(playerName => {
//       // Smart name matching
//       const cleanName = playerName.toLowerCase().split('(')[0].trim();
//       const player = matchData.players.find(p => 
//         p.name?.toLowerCase().includes(cleanName) ||
//         cleanName.includes(p.name?.toLowerCase())
//       );
      
//       if (player) {
//         stats[playerName] = {
//           runs: player.runs || 0,
//           wickets: player.wickets || 0,
//           fours: player.fours || 0,
//           sixes: player.sixes || 0,
//           catches: player.catches || 0,
//           role: player.role || "BAT"
//         };
//       } else {
//         stats[playerName] = mockPlayerStats(playerName);
//       }
//     });
//   } else {
//     // Fallback: mock realistic stats
//     players.forEach(playerName => {
//       stats[playerName] = mockPlayerStats(playerName);
//     });
//   }
  
//   return stats;
// }

// // Mock stats for demo/perfect fallback
// function mockPlayerStats(playerName) {
//   const name = playerName.toLowerCase();
//   const baseStats = {
//     runs: Math.floor(Math.random() * 60) + 5,
//     wickets: Math.floor(Math.random() * 3),
//     fours: Math.floor(Math.random() * 6),
//     sixes: Math.floor(Math.random() * 4),
//     catches: Math.floor(Math.random() * 2),
//     role: "ALL"
//   };

//   // Player-specific boosts
//   if (name.includes('rohit') || name.includes('kohli') || name.includes('gill')) {
//     baseStats.runs += 30;
//     baseStats.fours += 3;
//     baseStats.role = "BAT";
//   } else if (name.includes('bumrah') || name.includes('shami') || name.includes('siraj')) {
//     baseStats.wickets += 2;
//     baseStats.role = "BOWL";
//   } else if (name.includes('hardik') || name.includes('jaddu')) {
//     baseStats.role = "AR";
//   }

//   return baseStats;
// }

// // 🆗 REAL FANTASY SCORING ENGINE (Standard IPL rules)
// function calculateFantasyPoints(players, playerStats) {
//   let totalPoints = 0;
  
//   players.forEach(playerName => {
//     const stats = playerStats[playerName] || { runs: 0, wickets: 0, fours: 0, sixes: 0, catches: 0 };
//     let playerPoints = 0;
//     const isCaptain = playerName.toLowerCase().includes('(c)');
//     const isViceCaptain = playerName.toLowerCase().includes('(vc)');

//     // BATTING POINTS
//     playerPoints += stats.runs * 1;           // 1 per run
//     playerPoints += stats.fours * 1;          // 1 per boundary
//     playerPoints += stats.sixes * 2;          // 2 per six
//     if (stats.runs >= 30) playerPoints += 5;  // 30-run bonus
//     if (stats.runs >= 50) playerPoints += 10; // Half-century
//     if (stats.runs >= 100) playerPoints += 20;// Century

//     // BOWLING POINTS
//     playerPoints += stats.wickets * 25;       // 25 per wicket
//     if (stats.wickets >= 3) playerPoints += 5; // 3-wicket bonus
//     if (stats.wickets >= 4) playerPoints += 10;// 4-wicket bonus

//     // FIELDING POINTS
//     playerPoints += stats.catches * 8;        // 8 per catch/stumping
//     if (stats.catches >= 3) playerPoints += 4;// 3 catches bonus

//     // Captain (2x) / Vice-Captain (1.5x) multiplier
//     if (isCaptain) playerPoints *= 2;
//     else if (isViceCaptain) playerPoints *= 1.5;

//     totalPoints += Math.floor(playerPoints);
//   });

//   return totalPoints;
// }

// // 🛠️ API ROUTES


// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "index.html"));
// });



// // 2. Static assets (css, js, images, etc.)
// app.use(express.static(__dirname));

// app.get("/status", (req, res) => {
//   res.json({ 
//     status: "ok", 
//     service: "IPL 2026 Fantasy API v2.0",
//     teamsCount: teams.length,
//     cricapi: CRICAPI_KEY == "e18c70fc-6fe7-4a3c-94c4-f4241f69ab1f" ? "✅ Active" : "❌ Add your key",
//     dataFile: DATA_FILE
//   });
// });

// // 📋 Teams CRUD
// app.get("/api/teams", (req, res) => res.json(teams));


// app.post("/api/teams", async (req, res) => {
//   const { ownerName, teamName, match, players } = req.body;

//   if (!players?.length) {
//     return res.status(400).json({ error: "Players array required" });
//   }

//   const team = {
//     id: Date.now().toString(),
//     ownerName: ownerName?.trim() || "Anonymous",
//     teamName: teamName?.trim() || "Team XI",
//     match: match || "Practice Match",
//     players: players.map(p => String(p).trim()).filter(Boolean),
//     points: 0,
//     createdAt: new Date().toISOString(),
//     updatedAt: null,
//     playerStats: {},
//     lastScoredAt: null
//   };

//   await saveTeamToDb(team);
//   await loadTeamsFromDb(); // optional: fresh list

//   res.status(201).json(team);
// });






// app.patch("/api/teams/:id/points", async (req, res) => {
//   const { id } = req.params;
//   const { delta } = req.body;

//   const team = teams.find(t => t.id === id);
//   if (!team) return res.status(404).json({ error: "Team not found" });

//   const change = Number(delta);
//   if (isNaN(change) || change === 0) {
//     return res.status(400).json({ error: "Valid delta required" });
//   }

//   team.points += change;
//   team.updatedAt = new Date().toISOString();

//   await saveTeamToDb(team);
//   await loadTeamsFromDb(); // update global list

//   res.json(team);
// });



// app.get("/api/teams/:id", (req, res) => {
//   const team = teams.find(t => t.id === req.params.id);
//   if (!team) return res.status(404).json({ error: "Team not found" });
//   res.json(team);
// });


// app.delete("/api/teams/:id", async (req, res) => {
//   const idx = teams.findIndex(t => t.id === req.params.id);
//   if (idx === -1) return res.status(404).json({ error: "Team not found" });

//   teams.splice(idx, 1);
//   await deleteTeamFromDb(req.params.id);
//   await loadTeamsFromDb();

//   res.json({ message: "Team deleted" });
// });



// // 🏏 CRICAPI + LIVE SCORING
// app.get("/api/matches", async (req, res) => {
//   const matches = await getIPLMatches();
//   res.json(matches);
// });

// app.get("/api/matches/:matchId", async (req, res) => {
//   const score = await getMatchScore(req.params.matchId);
//   if (!score) return res.status(404).json({ error: "Match not found" });
//   res.json(score);
// });

// // 🎯 AUTO FANTASY SCORING (The Magic!)
// app.post("/api/teams/:id/calculate-points", async (req, res) => {
//   const { id } = req.params;
//   const team = teams.find(t => t.id === id);
//   if (!team) return res.status(404).json({ error: "Team not found" });

//   try {
//     const matchData = await getMatchScore(team.match);
//     const playerStats = await getPlayerStats(team.players, matchData);
//     const totalPoints = calculateFantasyPoints(team.players, playerStats);
//     const delta = totalPoints - team.points;

//     team.points = totalPoints;
//     team.playerStats = playerStats;
//     team.lastScoredAt = new Date().toISOString();

//     await saveTeamToDb(team);
//     await loadTeamsFromDb();

//     res.json({
//       team,
//       delta,
//       totalPoints,
//       playerStats,
//       message: `Auto-scored ${totalPoints} points! (${delta >= 0 ? '+' : ''}${delta})`
//     });
//   } catch (err) {
//     console.error("Auto-score error:", err);

//     const fallbackPoints = Math.floor(Math.random() * 250) + 75;
//     const delta = fallbackPoints - team.points;

//     team.points = fallbackPoints;
//     team.lastScoredAt = new Date().toISOString();

//     await saveTeamToDb(team);
//     await loadTeamsFromDb();

//     res.json({
//       team,
//       delta,
//       totalPoints: fallbackPoints,
//       message: `Fallback: ${fallbackPoints} pts (CricAPI unavailable)`
//     });
//   }
// });






// app.delete("/api/teams", async (req, res) => {
//   teams = [];
//   await saveTeams(teams);
//   res.json({ message: "All teams cleared" });
// });







// module.exports = app;



const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const { MongoClient } = require("mongodb");

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
  if (!uri) throw new Error("MONGODB_URI required");
  console.log("✅ MongoDB connecting...");
  await client.connect();
  db = client.db("iplfantasy2026");
  teamsCollection = db.collection("teams");
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

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// 🆕 FIXED: Safe auto-scoring on page load
app.get("/status", async (req, res) => {
  await loadTeamsFromDb();
  
  const scoringResult = await autoScoreRecentMatches();
  
  res.json({
    status: "ok",
    teamsCount: teams.length,
    autoScoring: `${scoringResult.updatedTeams || 0} teams updated`,
    cricapi: CRICAPI_KEY ? "✅ Active" : "❌ Missing",
    leaderboardTop: teams[0]?.points || 0,
  });
});

// 🆕 FIXED: Safe CricAPI handling
async function autoScoreRecentMatches() {
  let updatedTeams = 0;
  
  if (!CRICAPI_KEY) {
    console.log("⚠️ No CRICAPI_KEY - skipping auto-score");
    return { updatedTeams: 0 };
  }
  
  try {
    console.log("🔄 Checking recent IPL matches...");
    
    // Get recent matches SAFELY
    const matchesResponse = await axios.get("https://api.cricapi.com/v1/matches", {
      params: { apikey: CRICAPI_KEY, limit: 20 },
      timeout: 10000,
    });
    
    // 🆕 SAFE ARRAY CHECK
    const matchesData = Array.isArray(matchesResponse.data) ? matchesResponse.data : 
                       Array.isArray(matchesResponse.data?.data) ? matchesResponse.data.data : [];
    
    const recentIplMatches = matchesData.filter(m =>
      m && (
        (m.series?.name || '').toLowerCase().includes('ipl') ||
        (m.name || '').toLowerCase().includes('ipl')
      ) && 
      (m.matchEnded || m.statusSummary?.includes('Complete'))
    );
    
    console.log(`📱 Found ${recentIplMatches.length} IPL matches`);
    
    // Process last 3 completed matches
    for (const match of recentIplMatches.slice(0, 3)) {
      if (!match.id || lastScoredMatches.has(match.id)) {
        console.log(`⏭️ Skipping ${match.name || match.id}`);
        continue;
      }
      
      try {
        // Get match details SAFELY
        const matchResponse = await axios.get(`https://api.cricapi.com/v1/match/${match.id}`, {
          params: { apikey: CRICAPI_KEY },
          timeout: 8000,
        });
        
        const matchData = matchResponse.data;
        
        // Only score completed matches
        if (!matchData.matchEnded && !matchData.type?.includes("Complete")) {
          console.log(`⏳ ${match.name} not finished`);
          continue;
        }
        
        // Score teams for this match
        const matchTeams = teams.filter(t => t.match === match.id);
        console.log(`⚡ Scoring ${matchTeams.length} teams for ${match.name}`);
        
        for (const team of matchTeams) {
          const playerStats = getPlayerStats(team.players, matchData);
          const totalPoints = calculateFantasyPoints(team.players, playerStats);
          
          if (totalPoints > team.points) {
            team.points = totalPoints;
            team.playerStats = playerStats;
            team.lastScoredAt = new Date().toISOString();
            await saveTeamToDb(team);
            updatedTeams++;
          }
        }
        
        lastScoredMatches.add(match.id);
        console.log(`✅ ${matchTeams.length} teams scored for ${match.name}`);
        
      } catch (matchErr) {
        console.error(`❌ Match ${match.id} error:`, matchErr.message);
      }
    }
    
    await loadTeamsFromDb();
  } catch (err) {
    console.error("❌ Auto-score failed:", err.message);
  }
  
  return { updatedTeams };
}

// Teams endpoint
app.get("/api/teams", async (req, res) => {
  await loadTeamsFromDb();
  res.json(teams);
});

// Create team
app.post("/api/teams", async (req, res) => {
  const { ownerName, teamName, match, players } = req.body;
  
  if (!Array.isArray(players) || players.length < 11) {
    return res.status(400).json({ error: "11 players required" });
  }

  const team = {
    id: Date.now().toString(),
    ownerName: ownerName?.trim() || "Anonymous",
    teamName: teamName?.trim() || "My XI",
    match: match || "Practice",
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

// Single team
app.get("/api/teams/:id", async (req, res) => {
  const team = teams.find(t => t.id === req.params.id);
  res.status(team ? 200 : 404).json(team || { error: "Not found" });
});

// Delete
app.delete("/api/teams/:id", async (req, res) => {
  await deleteTeamFromDb(req.params.id);
  await loadTeamsFromDb();
  res.json({ message: "Deleted" });
});



// 🆕 FIXED: Robust IPL matches endpoint
// app.get("/api/matches", async (req, res) => {
//   try {
//     if (!CRICAPI_KEY) {
//       // Fallback demo matches
//       return res.json([
//         {
//           id: "12345",
//           name: "MI vs CSK - Final",
//           series: { name: "IPL 2026" },
//           matchStarted: true,
//           matchEnded: false
//         },
//         {
//           id: "12346", 
//           name: "RCB vs PBKS - Qualifier 1",
//           series: { name: "IPL 2026" },
//           matchStarted: true,
//           matchEnded: true
//         },
//         {
//           id: "12347",
//           name: "KKR vs SRH - Eliminator", 
//           series: { name: "IPL 2026" },
//           matchStarted: true,
//           matchEnded: true
//         }
//       ]);
//     }

//     const response = await axios.get("https://api.cricapi.com/v1/matches", {
//       params: { 
//         apikey: CRICAPI_KEY, 
//         limit: 50 
//       },
//       timeout: 10000
//     });

//     // 🆕 SAFE DATA EXTRACTION
//     let matches = [];
//     if (Array.isArray(response.data)) {
//       matches = response.data;
//     } else if (Array.isArray(response.data?.data)) {
//       matches = response.data.data;
//     }

//     // 🆕 FILTER & MAP with fallbacks
//     const iplMatches = matches
//       .filter(m => m && (
//         (m.name || '').toLowerCase().includes('indian premier league 2026')
//       ))
//       .map(m => ({
//         id: m.id || m.unique_id || `demo_${Math.random().toString(36).slice(2)}`,
//         name: m.name || `${m.team1 || 'Team A'} vs ${m.team2 || 'Team B'}`,
//         series: { 
//           name: m.series?.name || m.series?.shortName || 'IPL 2026'
//         },
//         matchStarted: m.matchStarted || false,
//         matchEnded: m.matchEnded || false,
//         date: m.date || m.dateTimeGMT
//       }))
//       .slice(0, 20);

//     console.log(`✅ Returning ${iplMatches.length} IPL matches`);
//     res.json(iplMatches);

//   } catch (error) {
//     console.error("❌ Matches API error:", error.message);
    
//     // 🆕 ROBUST FALLBACK
//     res.json([
//       {
//         id: "practice",
//         name: "Practice Match - Rohit XI vs Kohli XI", 
//         series: { name: "IPL Practice" },
//         matchStarted: true,
//         matchEnded: true
//       },
//       {
//         id: "demo1",
//         name: "MI vs CSK - Demo Final",
//         series: { name: "IPL 2026" },
//         matchStarted: true,
//         matchEnded: false
//       }
//     ]);
//   }
// });


app.get("/api/matches", async (req, res) => {
  try {
    if (!CRICAPI_KEY) {
      // Fallback demo matches for IPL 2026
      return res.json([
        {
          id: "demo1",
          name: "Kolkata Knight Riders vs Delhi Capitals, 70th Match, IPL 2026",
          matchType: "t20",
          status: "Practice match",
          venue: "Eden Gardens, Kolkata",
          date: "2026-05-24",
          dateTimeGMT: "2026-05-24T14:00:00",
          teams: ["Kolkata Knight Riders", "Delhi Capitals"],
          teamInfo: [
            { name: "Delhi Capitals", shortname: "DC" },
            { name: "Kolkata Knight Riders", shortname: "KKR" }
          ]
        }
      ]);
    }

    const response = await axios.get("https://api.cricapi.com/v1/matches", {
      params: {
        apikey: CRICAPI_KEY,
        limit: 50  // Get more to ensure IPL matches are captured
      },
      timeout: 10000
    });

    // Handle exact CricAPI structure: response.data.data = matches array
    let matches = [];
    if (Array.isArray(response.data?.data)) {
      matches = response.data.data;
    } else if (Array.isArray(response.data)) {
      matches = response.data;
    }

    // Filter for IPL 2026 matches (case-insensitive, flexible)
    const iplMatches = matches
      .filter(m => 
        m &&
        (m.name?.toLowerCase().includes('indian premier league 2026') ||
         m.name?.toLowerCase().includes('ipl 2026') ||
         m.series_id === "87c62aac-bc3c-4738-ab93-19da0690488f")  // From your sample
      )
      .map(m => ({
        id: m.id,
        name: m.name,
        matchType: m.matchType,
        status: m.status,
        venue: m.venue,
        date: m.date,
        dateTimeGMT: m.dateTimeGMT,
        teams: m.teams,
        teamInfo: m.teamInfo,  // Includes shortname, img
        series_id: m.series_id,
        fantasyEnabled: m.fantasyEnabled,
        matchStarted: m.matchStarted,
        matchEnded: m.matchEnded
      }))
      .slice(0, 20);  // Limit response size

    console.log(`✅ Returning ${iplMatches.length} IPL 2026 matches`);
    res.json(iplMatches);

  } catch (error) {
    console.error("❌ Matches API error:", error.message);
    
    // Robust fallback matching your sample structure
    res.json([
      {
        id: "aec16058-7741-4f3d-a1b0-68d7210b29c9",
        name: "Kolkata Knight Riders vs Delhi Capitals, 70th Match, Indian Premier League 2026",
        matchType: "t20",
        status: "Match starts at May 24, 14:00 GMT",
        venue: "Eden Gardens, Kolkata",
        date: "2026-05-24",
        dateTimeGMT: "2026-05-24T14:00:00",
        teams: ["Kolkata Knight Riders", "Delhi Capitals"],
        teamInfo: [
          { name: "Delhi Capitals", shortname: "DC" },
          { name: "Kolkata Knight Riders", shortname: "KKR" }
        ],
        series_id: "87c62aac-bc3c-4738-ab93-19da0690488f"
      }
    ]);
  }
});




// Single team check
app.post("/api/teams/:id/calculate-points", async (req, res) => {
  await autoScoreRecentMatches();
  const team = teams.find(t => t.id === req.params.id);
  
  res.json({
    team,
    message: team?.points ? `${team.points} pts` : "Match pending",
  });
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
}

// Scoring
function getPlayerStats(players, matchData) {
  const stats = {};
  players.forEach(playerName => {
    const s = { runs: 0, wickets: 0, fours: 0, sixes: 0, catches: 0 };
    
    if (matchData?.players?.length) {
      const clean = playerName.toLowerCase().split('(')[0].trim();
      const player = matchData.players.find(p =>
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
    }
    
    stats[playerName] = s;
  });
  return stats;
}

function calculateFantasyPoints(players, stats) {
  let total = 0;
  players.forEach(name => {
    const s = stats[name] || {};
    let pts = 
      s.runs + s.fours + (s.sixes * 2) + 
      (s.wickets * 25) + (s.catches * 8);
    
    if (s.runs >= 50) pts += 10;
    if (s.wickets >= 3) pts += 5;
    
    if (name.toLowerCase().includes('(c)')) pts *= 2;
    else if (name.toLowerCase().includes('(vc)')) pts *= 1.5;
    
    total += Math.floor(pts);
  });
  return total;
}
































