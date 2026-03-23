const server = require("../server");
const { createServer } = require("http");

// Wrap your Express app and export it as Vercel expects
module.exports = (req, res) => {
  const server = createServer(server.app);
  server.emit("request", req, res);
};