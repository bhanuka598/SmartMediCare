const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const telemedicineRoutes = require("./routes/telemedicineRoutes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Telemedicine Service is running"
  });
});

app.use("/api/telemedicine", telemedicineRoutes);

module.exports = app;