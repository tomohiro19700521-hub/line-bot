const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      console.log("EVENT:", JSON.stringify(event, null, 2));

      if (event.type !== "message") continue;
      if (!event.message || event.message.type !== "text") continue;

      const userMessage = event.message.text;
      const groupId = event.source.groupId || "";

      // =========================
      // 日報グループ
      // =========================
      if (groupId === "Cc2d7bc9e2e15c3e748d69af23ecddf8e") {

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
      // 売上グループ
      // =========================
      if (groupId === "C4313b02ab8a8a9e3f84f5e219105739e") {

        await axios.post(process.env.GOOGLE_SCRIPT_URL_SALES, {
          userId: event.source.userId || "",
          report: userMessage,
        });

        console.log("売上保存OK");
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
