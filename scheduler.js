const dotenv = require("dotenv").config();
const sendEmail = require("./sendEmail");

const run = async () => {
  try {
    const emailOptions = {
      to: "davidkraku69@gmail.com",
      text: "this is a test message",
      subject: "test-dev",
    };

    const result = await sendEmail(emailOptions);
    console.log("email sent succesfully");
  } catch (error) {
    console.log(error.message);
  }
};

run();
