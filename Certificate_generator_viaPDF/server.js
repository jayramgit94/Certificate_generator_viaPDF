// server.js
const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "/")));

// Serve the users data (JSON)
app.get("/data/users.json", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "users.json"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
