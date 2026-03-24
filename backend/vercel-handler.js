console.log("vercel-handler.js invoked");

// Tiny test handler
module.exports = async (req, res) => {
  console.log("Path:", req.url);

  if (req.url === "/" || req.url === "/index.html") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end("<h1>Live test</h1>");
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
};