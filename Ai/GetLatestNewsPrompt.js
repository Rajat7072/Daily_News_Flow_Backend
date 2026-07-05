const getLatestNewsPrompt = () => {
  const date = new Date().toDateString();

  const prompt = `
Fetch the 20 latest news headlines for today's ${date} from reliable Google News sources.

Requirements:
- Only include real, verified news facts.
- Do not hallucinate, invent, assume, or generate fake information.
- Use only currently available news from trusted sources.
- Each news item should be concise, around 3–4 lines maximum.
- Focus on major national and international news.
- Avoid duplicate stories.
- Return ONLY a valid JSON array of strings.
- Do not include commentary, markdown, code fences, or explanation.

FORMAT:
[
  "BJP secures majority in Bengal assembly with record-breaking performance, winning 220+ seats.",
  "Apple announces new AI-powered features for iPhone users during its annual event."
]
`;

  return prompt;
};

module.exports = getLatestNewsPrompt;
