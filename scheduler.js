const dotenv = require("dotenv").config();
const sendEmail = require("./sendEmail");
const motivationGenerator = require("./services/motivationGenerator");

const run = async () => {
  try {
    const text = await motivationGenerator();
    const emailOptions = {
      to: "davidkraku69@gmail.com",
      text,
      subject: "Message from Goggins",
    };

    const result = await sendEmail(emailOptions);
    console.log("email sent succesfully");
  } catch (error) {
    console.log(error.message);
  }
};

run();
