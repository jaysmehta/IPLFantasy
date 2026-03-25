// const server = require("./server");
// const http = require("http");

// module.exports = (req, res) => {
//   const serverInstance = http.createServer(server);
//   serverInstance.emit("request", req, res);
// };

// backend/vercel-handler.js



// const { MongoClient } = require("mongodb");
// const app = require("./server");
// const http = require("http");

// const uri = process.env.MONGODB_URI;

// const options = {
//   serverSelectionTimeoutMS: 10_000, // 10 seconds
//   connectTimeoutMS: 10_000,
//   socketTimeoutMS: 15_000,
//   maxPoolSize: 10,
// };

// let dbReady = false;

// async function connectDb() {

// console.log("✅ MongoDB connect call in handler");
//   const client = new MongoClient(uri, options);

//   try {
//     console.log("within connect try");
//     await Promise.race([
//       client.connect(),
//       new Promise((_, reject) =>
//         setTimeout(() => reject(new Error("Mongo connect timeout")), 12_000)

//       ),
//     ]);

//     const db = client.db("iplfantasy2026");
//     console.log("post DB");
//     const teamsCollection = db.collection("teams");

//     app.db = db;
//     app.teamsCollection = teamsCollection;
//     app.teams = await teamsCollection.find({}).toArray();

//     console.log("✅ MongoDB connected in handler", app.teams.length);
//     dbReady = true;
//   } catch (err) {
//     console.error("❌ MongoDB connection failed in handler:", err);
//   }
// }




//   console.log("✅ MongoDB connect call in handler");
//   const client = new MongoClient(uri);

//   const timeout = 12 * 1000; // 12 seconds

//   try {
//     const result = await Promise.race([
//       client.connect(),
//       new Promise((_, reject) => {
//         setTimeout(() => reject(new Error("MongoDB connect timeout")), timeout);
//       })
//     ]);

//     const db = client.db("iplfantasy2026");
//     const teamsCollection = db.collection("teams");

//     console.log("✅ MongoDB connected in handler");
//     console.log("📊 Collection", teamsCollection.s.namespace);

//     // Inject into app
//     app.db = db;
//     app.teamsCollection = teamsCollection;
//     app.teams = await teamsCollection.find({}).toArray();

//     dbReady = true;
//     console.log(`📊 Loaded ${app.teams.length} teams`);
//   } catch (err) {
//     console.log("❌ MongoDB connection failed in handler:", err);
//     console.log("❌ MONGODB_URI:", uri);
//   }
// }

// connectDb().catch(err =>
//   console.log("❌ connectDb top‑level error:", err)
// );

// connectDb().catch(err => {
//   console.error("❌ connectDb top‑level error:", err);
//   console.log("Error ",err);
// });

// const serverInstance = http.createServer(app);

// module.exports = (req, res) => {
//   if (!dbReady && req.url.startsWith("/api/")) {
//     res.statusCode = 503;
//     res.setHeader("Content-Type", "application/json");
//     res.end(
//       JSON.stringify({ error: "Database initializing, please retry" })
//     );
//     return;
//   }
//   serverInstance.emit("request", req, res);
// };



// vercel-handler.js

const mongoose = require("mongoose");
const app = require("./server");
const http = require("http");

const MONGODB_URI = process.env.MONGODB_URI;

let dbReady = false;

async function connectDb() {
  console.log("✅ MongoDB connect call in handler mongoose");

  const options = {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 15_000,
    maxPoolSize: 10,
  };

  try {


  mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected successfully to MongoDB Atlas!');
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('Ping successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log("MongoDB connection failed ",err.message);
    process.exit(1);
  });
    // await mongoose.connect(MONGODB_URI, options);

    // console.log("✅ MongoDB connected in handler (Mongoose)");
    // dbReady = true;

    // // Example: attach models / collections
    // const Team = mongoose.model(
    //   "Team",
    //   new mongoose.Schema({
    //     name: String,
    //     players: [String],
    //     // ... your fields
    //   })
    // );

    // If you still want plain `teams` array on app
    // const teams = await Team.find({}); // all teams
    // app.db = mongoose.connection; // or app.mongoose = mongoose
    // app.teams = teams;

    // console.log(`📊 Loaded ${teams.length} teams`);
  } catch (err) {
    console.error("❌ MongoDB connection failed in handler (Mongoose):", err);
    console.log("MongoDB connection failed ",err.message);
  }
}

// Top‑level error handling
connectDb().catch((err) => {
  console.error("❌ connectDb top‑level error (Mongoose):", err);
});

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





















