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
  await client.connect();
  const db = client.db("iplfantasy2026");
  const teamsCollection = db.collection("teams");
  console.log("✅ MongoDB connected in handler");
  app.db = db;
  app.teamsCollection = teamsCollection;
  dbReady = true;
}

connectDb().catch(err => {
  console.error("❌ MongoDB init failed in handler:", err);
});

const serverInstance = http.createServer(app);

module.exports = (req, res) => {
  if (!dbReady && req.url.startsWith("/api/")) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Database initializing, please retry" }));
    return;
  }
  serverInstance.emit("request", req, res);
};
