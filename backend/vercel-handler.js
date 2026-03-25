// vercel-handler.js

const mongoose = require("mongoose");
const app = require("./server");
const http = require("http");

const MONGODB_URI = process.env.MONGODB_URI;

let dbReady = false;

function connectDb() {
  console.log("✅ MongoDB connect call in handler");

  const options = {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 15_000,
    maxPoolSize: 10,
  };

  mongoose
    .connect(MONGODB_URI, options)
    .then(() => {
      console.log("✅ MongoDB connected in handler (Mongoose)");
      dbReady = true;

      // Example: define a Team model and preload teams
      const Team = mongoose.model(
        "Team",
        new mongoose.Schema({
          name: String,
          players: [String],
          // ... your fields
        })
      );

      Team.find({})
        .then((teams) => {
          app.db = mongoose.connection;
          app.teams = teams;

          console.log(`📊 Loaded ${teams.length} teams`);
        })
        .catch((err) => {
          console.error("❌ Failed to load teams:", err);
        });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed in handler (Mongoose):", err);
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
