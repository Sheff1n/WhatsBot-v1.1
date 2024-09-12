const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail", // Or another service (e.g., Yahoo, Outlook)
  auth: {
    user: "mohammedsheffin8@gmail.com", // Replace with your email
    pass: "cirj uoij lhbb fmwu", // Replace with your email password or app-specific password
  },
});


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

// Step 1: Selection of room or partition
const roomSelectionObject = {
  type: "interactive",
  interactive: {
    type: "button",
    body: {
      text: "I am looking for a:",
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "room",
            title: "Room",
          },
        },
        {
          type: "reply",
          reply: {
            id: "partition",
            title: "Partition",
          },
        },
      ],
    },
  },
};

// Step 2: Description of occupants
const occupantDescriptionObject = {
  type: "interactive",
  interactive: {
    type: "button",
    body: {
      text: "Please describe the occupants:",
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "single_male",
            title: "Single Male",
          },
        },
        {
          type: "reply",
          reply: {
            id: "single_female",
            title: "Single Female",
          },
        },
        {
          type: "reply",
          reply: {
            id: "couple",
            title: "Couple",
          },
        },
      ],
    },
  },
};

// Step 3: Selection of preferred location
const locationSelectionObject = {
  type: "interactive",
  interactive: {
    type: "button",
    body: {
      text: "What is your preferred location?",
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "location_burjuman",
            title: "Burjuman",
          },
        },
        {
          type: "reply",
          reply: {
            id: "location_deira_city_center",
            title: "Deira City Center",
          },
        },
        {
          type: "reply",
          reply: {
            id: "location_fahidi",
            title: "Fahidi",
          },
        },
      ],
    },
  },
};

// Step 4: Selection of budget range
const budgetSelectionObject = {
  type: "interactive",
  interactive: {
    type: "button",
    body: {
      text: "How much is your budget?",
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "budget_1000_2000",
            title: "1000 - 2000",
          },
        },
        {
          type: "reply",
          reply: {
            id: "budget_2000_4000",
            title: "2000 - 4000",
          },
        },
        {
          type: "reply",
          reply: {
            id: "budget_above_4000",
            title: "4000 and above",
          },
        },
      ],
    },
  },
};

// Confirmation message with the selected options
const confirmationObject = (details) => ({
  type: "interactive",
  interactive: {
    type: "button",
    body: {
      text: `Please confirm your details:\n\nLooking For: ${details.selection}\nOccupants: ${details.occupants}\nLocation: ${details.location}\nBudget: ${details.budget}\nAre these details correct?`,
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
                  text: "Customer",
                },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: 0,
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

const sendAdminTemplateMessage = async (phon_no_id, clientDetails) => {
  try {
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v13.0/${phon_no_id}/messages?access_token=${token}`,
      data: {
        messaging_product: "whatsapp",
        to: adminPhoneNumber,
        type: "template",
        template: {
          name: "user_details", // Your template name
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: `Number: ${clientDetails.number}` }, // Replace {{1}} with client number
              ],
            },
          ],
        },
      },
      headers: { "Content-Type": "application/json" },
    });
    console.log("Admin template message sent successfully");
  } catch (error) {
    console.error("Error sending admin template message:", error.response ? error.response.data : error.message);
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

      let responseObject = roomSelectionObject; // Start with room selection
      if (selected_id) {
        if (selected_id === "room" || selected_id === "partition") {
          userSelections[from] = { selection: selected_id };
          responseObject = occupantDescriptionObject; // Move to occupant description
        } else if (selected_id.startsWith("single_") || selected_id === "couple") {
          userSelections[from].occupants = selected_id.replace("_", " ");
          responseObject = locationSelectionObject; // Move to location selection
        } else if (selected_id.startsWith("location_")) {
          userSelections[from].location = selected_id.replace("location_", "").replace(/_/g, " ");
          responseObject = budgetSelectionObject; // Move to budget selection
        } else if (selected_id.startsWith("budget_")) {
          userSelections[from].budget = selected_id.replace("budget_", "").replace(/_/g, " ");
          responseObject = confirmationObject(userSelections[from]); // Show confirmation
        } else if (selected_id === "confirmation_yes") {
          let clientDetails = userSelections[from];
          let messageToAdmin = `Client Number: ${from}\nLooking For: ${clientDetails.selection}\nOccupants: ${clientDetails.occupants}\nLocation: ${clientDetails.location}\nBudget: ${clientDetails.budget}`;

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

            // Send confirmation to client
            await axios({
              method: "POST",
              url: `https://graph.facebook.com/v13.0/${phon_no_id}/messages?access_token=${token}`,
              data: {
                messaging_product: "whatsapp",
                to: from,
                text: {
                  body: "Thank you for confirming! Your details have been forwarded to our team. For more details call +919895260915",
                },
              },
              headers: {
                "Content-Type": "application/json",
              },
            });

            // Send thank you template message to client
            await sendTemplateMessage(phon_no_id, from, token);
            await sendAdminTemplateMessage(phon_no_id, { number: from });

            const mailOptions = {
              from: "mohammedsheffin8@gmail.com", // Sender address
              to: "mohammedsheffin8@gmail.com", // List of receivers
              subject: "New Client Details",
              text: messageToAdmin, // Plain text body
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error("Error sending email:", error);
              } else {
                console.log("Email sent successfully:", info.response);
              }
            });
                
            res.sendStatus(200);
          } catch (error) {
            console.error("Error sending message:", error.response ? error.response.data : error.message);
            res.sendStatus(500);
          }
          return;
        } else if (selected_id === "confirmation_no") {
          // Reset the selections and start over
          userSelections[from] = {};
          responseObject = roomSelectionObject;
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
