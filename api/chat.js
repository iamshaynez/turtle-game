// api/chat.js

const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // 请确保在 Vercel 上设置了这个环境变量
  })
);

// 固定的提示词
const fixedPrompt = "这是一个固定的提示词，将会添加到每次对话中。";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send({ message: "仅支持 POST 请求" });
    return;
  }

  const { messages } = req.body;

  if (!messages) {
    res.status(400).send({ message: "缺少 messages 参数" });
    return;
  }

  try {
    // 将固定提示词与对话内容组合
    const promptMessages = [
      { role: "system", content: fixedPrompt },
      ...messages,
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: promptMessages,
    });

    const responseMessage = completion.data.choices[0].message;

    res.status(200).json({ message: responseMessage });
  } catch (error) {
    console.error("调用 OpenAI API 时出错：", error);
    res.status(500).send({ message: "处理请求时出错" });
  }
};