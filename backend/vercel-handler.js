const server = require("./server");
const http = require("http");

module.exports = (req, res) => {
  const serverInstance = http.createServer(server);
  serverInstance.emit("request", req, res);
};