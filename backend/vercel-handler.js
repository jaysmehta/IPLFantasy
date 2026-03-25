const { MongoClient } = require("mongodb");
const app = require("./server");
const http = require("http");

const uri = process.env.MONGODB_URI;

let dbReady = false;

function connectDb() {
  console.log("✅ MongoDB connect call in handler");

  const options = {
    serverSelectionTimeoutMS: 5_000, // 5 seconds
    socketTimeoutMS: 10_000,
    maxPoolSize: 10,
  };

  const client = new MongoClient(uri, options);

  // Force timeout after 8 seconds
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Mongo connect timeout")), 8_000)
  );

  Promise.race([client.connect(), timeoutPromise])
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
      console.info("📍 MongoDB connect finally");
    });
}

connectDb();

const serverInstance = http.createServer(app);

module.exports = (req, res) => {
  if (!dbReady && req.url.startsWith("/api/")) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ error: "Database initializing, please retry" })
    );
    console.log("❗ Request blocked: dbReady = false");
    return;
  }
  serverInstance.emit("request", req, res);
};
