const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express().use(body_parser.json());

const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;

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

const interactiveObject = {
  type: "interactive",
  interactive: {
    type: "list",
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
      button: "List",
      sections: [
        {
          title: "Services",
          rows: [
            {
              id: "1",
              title: "Web Development",
              description: "Any Language",
            },
            {
              id: "2",
              title: "Web Design",
            },
            {
              id: "3",
              title: "App Development",
              description: "Any Language",
            },
            {
              id: "4",
              title: "Automation",
              description: "Any Language",
            },
          ],
        },
      ],
    },
  },
};

const languageSelectionObject = {
  type: "interactive",
  interactive: {
    type: "list",
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
      button: "Select Language",
      sections: [
        {
          title: "Languages",
          rows: [
            {
              id: "lang_1",
              title: "JavaScript",
            },
            {
              id: "lang_2",
              title: "Python",
            },
            {
              id: "lang_3",
              title: "Java",
            },
            {
              id: "lang_4",
              title: "PHP",
            },
          ],
        },
      ],
    },
  },
};

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

      // Check if the message is a list response
      let message = body_param.entry[0].changes[0].value.messages[0];
      let msg_body = message.text ? message.text.body : "";
      let selected_id = message.interactive ? message.interactive.list_reply.id : "";

      console.log("Phone number: " + phon_no_id);
      console.log("From: " + from);
      console.log("Body param: " + msg_body);
      console.log("Selected ID: " + selected_id);

      let responseObject = interactiveObject;
      if (selected_id === "1") {
        responseObject = languageSelectionObject;
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
