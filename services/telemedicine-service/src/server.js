require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5007;

connectDB();

app.listen(PORT, () => {
  console.log(`Telemedicine Service running on port ${PORT}`);
});