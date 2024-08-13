const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express().use(body_parser.json());

const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;
const adminPhoneNumber = "919895260915"; // The phone number to send the final message to

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
    body: {
      text: "What can I help you with?",
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "web_development",
            title: "Web Development",
          },
        },
        {
          type: "reply",
          reply: {
            id: "app_development",
            title: "App Development",
          },
        },
        {
          type: "reply",
          reply: {
            id: "automation",
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
    body: {
      text: "Choose one of the following languages:",
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
      ],
    },
  },
};

const budgetSelectionObject = {
  type: "interactive",
  interactive: {
    type: "button",
    body: {
      text: "Select your budget range:",
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
            title: "10000-50000",
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

const confirmationObject = (details) => ({
  type: "interactive",
  interactive: {
    type: "button",
    body: {
      text: `Please confirm your details:\n\nService: ${details.service}\nLanguage: ${details.language}\nBudget: ${details.budget}\nAre these details correct?`,
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "confirmation_yes",
            title: "Yes",
          },
        },
        {
          type: "reply",
          reply: {
            id: "confirmation_no",
            title: "No",
          },
        },
      ],
    },
  },
});

const sendTemplateMessage = async (phone_number_id, to, access_token) => {
  try {
    const response = await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "template",
        template: {
          name: "thank_you_1",
          language: {
            code: "en_US",
          },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: {
                    link: "https://images.shiksha.com/mediadata/images/articles/1513768929php7jR4DL.jpeg",
                  },
                },
              ],
            },
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: "Sheffin",
                },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index:0,
              parameters: [
                {
                  type: "text",
                  text: "/",
                },
              ],
            },
          ],
        },
      },
    });

    console.log("Template message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending template message:", error.response ? error.response.data : error.message);
  }
};

const sendTemplateMessage1 = async (phone_number_id, to, access_token) => {
  try {
    const response = await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: "thank_you_2", // The name of your template
          language: {
            code: "en_US", // Language code for the template
          },
        },
      },
    });

    console.log("Template message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending template message:", error.response ? error.response.data : error.message);
  }
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

      let responseObject = serviceSelectionObject;
      if (selected_id) {
        if (selected_id.startsWith("web_development") || selected_id.startsWith("app_development") || selected_id.startsWith("automation")) {
          userSelections[from] = { service: selected_id.replace(/_/g, " ") };
          responseObject = languageSelectionObject;
        } else if (selected_id.startsWith("lang_")) {
          userSelections[from].language = selected_id.replace("lang_", "").replace(/_/g, " ");
          responseObject = budgetSelectionObject;
        } else if (selected_id.startsWith("budget_")) {
          userSelections[from].budget = selected_id.replace("budget_", "").replace(/_/g, " ");
          responseObject = confirmationObject(userSelections[from]);
        } else if (selected_id === "confirmation_yes") {
          let clientDetails = userSelections[from];
          let messageToAdmin = `Client Number: ${from}\nService: ${clientDetails.service}\nLanguage: ${clientDetails.language}\nBudget: ${clientDetails.budget}`;

          try {
            // Send message to admin
            await axios({
              method: "POST",
              url: `https://graph.facebook.com/v13.0/${phon_no_id}/messages?access_token=${token}`,
              data: {
                messaging_product: "whatsapp",
                to: adminPhoneNumber,
                text: {
                  body: messageToAdmin,
                },
              },
              headers: {
                "Content-Type": "application/json",
              },
            });

            // Send thank you template message to client
            await sendTemplateMessage(phon_no_id, from, token);

            await sendTemplateMessage1(phon_no_id, from, token);

            res.sendStatus(200);
          } catch (error) {
            console.error("Error sending message:", error.response ? error.response.data : error.message);
            res.sendStatus(500);
          }
          return;
        } else if (selected_id === "confirmation_no") {
          // Reset the selections and start over
          userSelections[from] = {};
          responseObject = serviceSelectionObject;
        }
      }

      try {
        const response = await axios({
          method: "POST",
          url: `https://graph.facebook.com/v13.0/${phon_no_id}/messages?access_token=${token}`,
          data: {
            messaging_product: "whatsapp",
            to: from,
            type: responseObject.type,
            interactive: responseObject.interactive,
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
    } else {
      res.sendStatus(404);
    }
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Hello, this is webhook setup");
});
