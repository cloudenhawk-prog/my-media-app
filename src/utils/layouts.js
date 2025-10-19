// utils/layouts.js
const fs = require("fs");

const path = require("path");

function loadLayout(filename) {
  try {
    const filePath = path.join(__dirname, "..", "public", "layouts", filename);
    const data = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(data);
    return json.windows || [];
  } catch (err) {
    console.error("Failed to load layout:", err);
    return [];
  }
}

module.exports = { loadLayout };
