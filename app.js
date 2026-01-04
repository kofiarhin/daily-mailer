const express = require("express");
const app = express();
const sendEmail = require("./sendEmail");

// setup middlewares
app.use(express.json());

app.get("/", async (req, res, next) => {
  return res.json({ message: "hello world" });
});

app.post("/api/send-mail", async (req, res, next) => {
  const { text, email, subject } = req.body;

  const result = await sendEmail({ to: email, text, subject });

  console.log("email sent successfully");
  return res.json({ message: `email sent to ${email}` });
});

module.exports = app;
