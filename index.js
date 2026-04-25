const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type !== "message") continue;
      if (!event.message || event.message.type !== "text") continue;

      const userMessage = event.message.text;

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: userMessage,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const reply = response.data.choices[0].message.content;

      await axios.post(process.env.GOOGLE_SCRIPT_URL, {
        userId: event.source.userId || event.source.groupId || "",
        report: userMessage,
        analysis: reply,
      });

      console.log("日報を保存しました");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("エラー:", error.response?.data || error.message);
    res.sendStatus(200);
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
