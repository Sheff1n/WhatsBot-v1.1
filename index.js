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
      text: "I’m Sheffin, a specialist in website automation and IT solutions.",
    },
    body: {
      text: "What can I help you with",
    },
    action: {
      button: "List",
      sections: [
        {
          rows: [
            {
              id: "1",
              title: "Web developing",
              description: "Any Language",
            },
            {
              id: "2",
              title: "Web Designs",
            },
            {
              id: "3",
              title: "App developing",
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
      let phon_no_id =
        body_param.entry[0].changes[0].value.metadata.phone_number_id;
      let from = body_param.entry[0].changes[0].value.messages[0].from;
      let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

      console.log("Phone number: " + phon_no_id);
      console.log("From: " + from);
      console.log("Body param: " + msg_body);

      try {
        const response = await axios({
          method: "POST",
          url: `https://graph.facebook.com/v13.0/${phon_no_id}/messages?access_token=${token}`,
          data: {
            messaging_product: "whatsapp",
            to: from,
            ...interactiveObject,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Message sent successfully:", response.data);
        res.sendStatus(200);
      } catch (error) {
        console.error(
          "Error sending message:",
          error.response ? error.response.data : error.message
        );
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
