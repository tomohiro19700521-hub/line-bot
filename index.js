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

      // =========================
      // 日報処理
      // =========================
      if (userMessage.startsWith("日報")) {

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o-mini",
            messages: [
              { role: "user", content: userMessage }
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

        await axios.post(process.env.GOOGLE_SCRIPT_URL_DAILY, {
          userId: event.source.userId || "",
          report: userMessage,
          analysis: reply,
        });

        console.log("日報保存OK");
      }

      // =========================
      // 売上処理
      // =========================
      else if (userMessage.startsWith("売上")) {

        await axios.post(process.env.GOOGLE_SCRIPT_URL_SALES, {
          userId: event.source.userId || "",
          report: userMessage,
        });

        console.log("売上保存OK");
      }

      // =========================
      // その他（無視）
      // =========================
      else {
        console.log("対象外メッセージ:", userMessage);
      }
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
