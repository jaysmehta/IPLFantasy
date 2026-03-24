const app = require("./server");
const serverless = require("serverless-http");

const wrapped = serverless(app);

module.exports = (req, res) => {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error("🚨 Request timed out in handler (fallback)");
      res.status(500).json({ error: "Backend took too long" });
    }
  }, 10_000); // 10 seconds max

  wrapped(req, res, () => {
    clearTimeout(timeoutId);
  });
};