const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express().use(body_parser.json());

const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;
const adminPhoneNumber = "9895260915"; // The phone number to send the final message to

app.listen(process.env.PORT, () => {
  console.log("Webhook is listening");
});

// To verify the callback URL from the dashboard side - cloud API side
app.get("/webhook", (req, res) => {
  let mode = req.query["hub.mode"];
  let challenge = req.query["hub.challenge"];
  let token = req.query["hub.verify_token"];

  if (mode && token) {
    if (mode === "subscribe" && token === mytoken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

const serviceSelectionObject = {
  type: "interactive",
  interactive: {
    type: "button",
    header: {
      type: "text",
      text: "IT Solutions by Sheffin",
    },
    body: {
      text: "What can I help you with?",
    },
    footer: {
      text: "Please select an option",
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "service_web_development",
            title: "Web Development",
          },
        },
        {
          type: "reply",
          reply: {
            id: "service_app_development",
            title: "App Development",
          },
        },
        {
          type: "reply",
          reply: {
            id: "service_automation",
            title: "Automation",
          },
        },
      ],
    },
  },
};

const languageSelectionObject = {
  type: "interactive",
  interactive: {
    type: "button",
    header: {
      type: "text",
      text: "Select Development Language",
    },
    body: {
      text: "Choose one of the following languages:",
    },
    footer: {
      text: "Select your preferred language",
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "lang_javascript",
            title: "JavaScript",
          },
        },
        {
          type: "reply",
          reply: {
            id: "lang_python",
            title: "Python",
          },
        },
        {
          type: "reply",
          reply: {
            id: "lang_java",
            title: "Java",
          },
        },
        {
          type: "reply",
          reply: {
            id: "lang_php",
            title: "PHP",
          },
        },
      ],
    },
  },
};

const budgetSelectionObject = {
  type: "interactive",
  interactive: {
    type: "button",
    header: {
      type: "text",
      text: "Select Your Budget",
    },
    body: {
      text: "Choose one of the following budget ranges:",
    },
    footer: {
      text: "Select your budget",
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "budget_below_10000",
            title: "Below 10000",
          },
        },
        {
          type: "reply",
          reply: {
            id: "budget_10000_50000",
            title: "Between 10000 and 50000",
          },
        },
        {
          type: "reply",
          reply: {
            id: "budget_above_50000",
            title: "Above 50000",
          },
        },
      ],
    },
  },
};

let userSelections = {};

app.post("/webhook", async (req, res) => {
  let body_param = req.body;

  console.log(JSON.stringify(body_param, null, 2));

  if (body_param.object) {
    console.log("Inside body param");
    if (
      body_param.entry &&
      body_param.entry[0].changes &&
      body_param.entry[0].changes[0].value.messages &&
      body_param.entry[0].changes[0].value.messages[0]
    ) {
      let phon_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
      let from = body_param.entry[0].changes[0].value.messages[0].from;

      // Check if the message is a button response
      let message = body_param.entry[0].changes[0].value.messages[0];
      let selected_id = message.interactive ? message.interactive.button_reply.id : "";

      console.log("Phone number: " + phon_no_id);
      console.log("From: " + from);
      console.log("Selected ID: " + selected_id);

      if (!userSelections[from]) {
        userSelections[from] = {};
      }

      if (selected_id.startsWith("service_")) {
        let services = {
          "service_web_development": "Web Development",
          "service_app_development": "App Development",
          "service_automation": "Automation",
        };
        userSelections[from].service = services[selected_id];

        try {
          const response = await axios({
            method: "POST",
            url: `https://graph.facebook.com/v13.0/${phon_no_id}/messages?access_token=${token}`,
            data: {
              messaging_product: "whatsapp",
              to: from,
              type: languageSelectionObject.type,
              interactive: languageSelectionObject.interactive,
            },
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("Message sent successfully:", response.data);
          res.sendStatus(200);
        } catch (error) {
          console.error("Error sending message:", error.response ? error.response.data : error.message);
          res.sendStatus(500);
        }
      } else if (selected_id.startsWith("lang_")) {
        const languages = {
          "lang_javascript": "JavaScript",
          "lang_python": "Python",
          "lang_java": "Java",
          "lang_php": "PHP",
        };
        userSelections[from].language = languages[selected_id];

        try {
          const response = await axios({
            method: "POST",
            url: `https://graph.facebook.com/v13.0/${phon_no_id}/messages?access_token=${token}`,
            data: {
              messaging_product: "whatsapp",
              to: from,
              type: budgetSelectionObject.type,
              interactive: budgetSelectionObject.interactive,
            },
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("Message sent successfully:", response.data);
          res.sendStatus(200);
        } catch (error) {
          console.error("Error sending message:", error.response ? error.response.data : error.message);
          res.sendStatus(500);
        }
      } else if (selected_id.startsWith("budget_")) {
        const budgets = {
          "budget_below_10000": "Below 10000",
          "budget_10000_50000": "Between 10000 and 50000",
          "budget_above_50000": "Above 50000",
        };
        userSelections[from].budget = budgets[selected_id];

        try {
          const response = await axios({
            method: "POST",
            url: `https://graph.facebook.com/v13.0/${phon_no_id}/messages?access_token=${token}`,
            data: {
              messaging_product: "whatsapp",
              to: adminPhoneNumber,
              type: "text",
              text: {
                body: `Service: ${userSelections[from].service}\nLanguage: ${userSelections[from].language}\nBudget: ${userSelections[from].budget}`,
              },
            },
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("Message sent successfully:", response.data);
          res.sendStatus(200);
        } catch (error) {
          console.error("Error sending message:", error.response ? error.response.data : error.message);
          res.sendStatus(500);
        }

        // Clear the user selection after sending the message
        delete userSelections[from];
      } else {
        // Handle other cases, e.g., initial interaction
        try {
          const response = await axios({
            method: "POST",
            url: `https://graph.facebook.com/v13.0/${phon_no_id}/messages?access_token=${token}`,
            data: {
              messaging_product: "whatsapp",
              to: from,
              type: serviceSelectionObject.type,
              interactive: serviceSelectionObject.interactive,
            },
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("Message sent successfully:", response.data);
          res.sendStatus(200);
        } catch (error) {
          console.error("Error sending message:", error.response ? error.response.data : error.message);
          res.sendStatus(500);
        }
      }
    } else {
      res.sendStatus(404);
    }
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Hello, this is webhook setup");
});
