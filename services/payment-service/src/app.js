const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const paymentRoutes = require("./routes/paymentRoutes");
const paymentController = require("./controllers/paymentController");

const app = express();

app.use(cors());
app.use(helmet());
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.post("/api/payments/webhook", paymentController.handleWebhook);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Payment Service is running",
    provider: "stripe"
  });
});

app.use("/api/payments", paymentRoutes);

module.exports = app;
