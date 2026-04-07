const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Appointment Service is running"
  });
});

app.use("/api/appointments", appointmentRoutes);

module.exports = app;