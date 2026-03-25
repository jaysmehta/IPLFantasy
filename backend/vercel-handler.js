// vercel-handler.js

const { MongoClient } = require("mongodb");
const app = require("./server");
const http = require("http");

const uri = process.env.MONGODB_URI;

let dbReady = false;

function connectDb() {
  console.log("✅ MongoDB connect call in handler");

  const options = {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 15_000,
    maxPoolSize: 10,
  };

  const client = new MongoClient(uri, options);

  // Use promises; no await
  client
    .connect()
    .then(() => {
      console.log("✅ MongoDB connected in handler");

      const db = client.db("iplfantasy2026");
      const teamsCollection = db.collection("teams");

      app.db = db;
      app.teamsCollection = teamsCollection;

      return teamsCollection.find({}).toArray();
    })
    .then((teams) => {
      app.teams = teams;
      dbReady = true;
      console.log(`📊 Loaded ${teams.length} teams`);
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed in handler:", err);
    })
    .finally(() => {
      // In a serverless context, you typically don’t close here.
      // If you ever want to, expose client on app and close per request.
    });
}

// Top‑level: just call the plain function
connectDb();

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
