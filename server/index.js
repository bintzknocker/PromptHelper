import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS) || 8192;

const anthropic = new Anthropic({ apiKey });
const app = express();

app.use(express.json());

app.post('/api/complete', async (req, res) => {
  const { prompt } = req.body;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    if (message.stop_reason === 'max_tokens') {
      return res.status(502).json({ error: 'AI response was truncated (hit max_tokens)' });
    }

    const completion = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    res.json({ completion });
  } catch (err) {
    console.error('Anthropic API error:', err);
    res.status(502).json({ error: 'Failed to reach the AI provider' });
  }
});

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`Prompt Maker backend listening on http://localhost:${port}`);
});
