// const server = require("./server");
// const http = require("http");

// module.exports = (req, res) => {
//   const serverInstance = http.createServer(server);
//   serverInstance.emit("request", req, res);
// };

// backend/vercel-handler.js
const { MongoClient } = require("mongodb");
const app = require("./server");
const http = require("http");

const uri = process.env.MONGODB_URI;

let dbReady = false;

async function connectDb() {
  console.log("✅ MongoDB connect call in handler");
  const client = new MongoClient(uri);

  const timeout = 20 * 1000; // 12 seconds

  try {
    const result = await Promise.race([
      client.connect(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("MongoDB connect timeout")), timeout);
      })
    ]);

    const db = client.db("iplfantasy2026");
    const teamsCollection = db.collection("teams");

    console.log("✅ MongoDB connected in handler");
    console.log("📊 Collection", teamsCollection.s.namespace);

    // Inject into app
    app.db = db;
    app.teamsCollection = teamsCollection;
    app.teams = await teamsCollection.find({}).toArray();

    dbReady = true;
    console.log(`📊 Loaded ${app.teams.length} teams`);
  } catch (err) {
    console.log("❌ MongoDB connection failed in handler:", err);
    console.log("❌ MONGODB_URI:", uri);
  }
}

connectDb().catch(err =>
  console.log("❌ connectDb top‑level error:", err)
);

const serverInstance = http.createServer(app);

module.exports = (req, res) => {
  if (!dbReady && req.url.startsWith("/api/")) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ error: "Database initializing, please retry" })
    );
    return;
  }
  serverInstance.emit("request", req, res);
};

