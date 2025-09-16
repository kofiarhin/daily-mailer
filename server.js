const express = require("express");
const app = express();

const port = process.env.PORT || 5000;

app.get("/", (req, res, next) => {
  return res.json({ message: "hello world" });
});

app.listen(port, () => console.log("server started on port:", port));
