const Groq = require("groq-sdk");
const { Stream } = require("openai/core/streaming.js");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const llm = async (prompt) => {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      stream: false,
      top_p: 0.9,
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });
    return response.choices[0].message.content;
  } catch (error) {
    return { success: false, msg: "Some Error Occured", error };
  }
};
module.exports = llm;
