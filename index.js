const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const FLOWISE_API_URL = process.env.FLOWISE_API_URL;
const CHATWOOT_API_KEY = process.env.CHATWOOT_API_KEY;
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

app.post("/webhook", async (req, res) => {
  const event = req.body;
  if (event.event !== "message_created") return res.sendStatus(200);

  const message = event.message;
  if (!message || message.private || message.message_type !== "incoming") return res.sendStatus(200);

  const question = message.content;
  const conversationId = message.conversation.id;

  try {
    const flowiseResponse = await axios.post(FLOWISE_API_URL, {
      question: question,
    });

    const answer = flowiseResponse.data.text || "Brak odpowiedzi z Flowise.";

    await axios.post(
      `https://chatzerah.online/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        content: answer,
        message_type: "outgoing",
        private: false,
      },
      {
        headers: {
          api_access_token: CHATWOOT_API_KEY,
        },
      }
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("Błąd:", error.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});
