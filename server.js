const express = require("express");
const app = express();
const sendEmail = require("./sendEmail");

const port = process.env.PORT || 5000;

app.get("/", async (req, res, next) => {
  const options = {
    to: "kofiarhin69@gmail.com",
    subject: "tesing mic",
    text: "this is a testing text",
  };

  await sendEmail(options);
  return res.json({ message: "hello world" });
});

app.listen(port, () => console.log("server started on port:", port));
