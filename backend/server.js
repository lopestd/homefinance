const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { createApp } = require("./src/config/app");

const PORT = parseInt(process.env.PORT || "3000", 10);
const app = createApp();

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
