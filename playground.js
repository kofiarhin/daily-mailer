// playground.js
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const motivationGenerator = require("./services/motivationGenerator");

const run = async () => {
  console.log("ENV KEY PREFIX:", (process.env.GROQ_API_KEY || "").slice(0, 4));

  const result = await motivationGenerator({
    count: 5,
    tone: "tough-love",
    context: "general",
    audience: "general",
    optional: { timebox_minutes: 25 },
  });

  console.log({ result });
};

run().catch((err) => console.error(err));
