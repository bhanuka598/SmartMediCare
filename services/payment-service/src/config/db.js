const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Payment Service DB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Payment Service DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
