require("dotenv").config();
const { httpServer } = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5001;

connectDB();

httpServer.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
  console.log(`WebSocket server ready for real-time updates`);
});