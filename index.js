import multer from 'multer';
import fs from 'fs';
import { OpenAI } from 'openai';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const upload = multer({ dest: 'uploads/' });

app.post('/api/generate', upload.single('image'), async (req, res) => {
  const promptText = req.body.prompt || '';
  const image = req.file;

  const isReactionMode = promptText.startsWith("REACT:");


  try {
    let messages;

    if (isReactionMode) {
      // Reaction Mode only
      messages = [
        {
          role: "system",
          content: `You are SayRizz — an AI wingman that generates bold, short, confident, and flirty reactions for Gen Z social situations.

    Rules:
    - Tone: Confident, bold, and flirty — Gen Z texting style.
    - Keep it under 20 words.
    - Don’t explain. Just drop the line like you're texting it.
    - NEVER sound like an AI.
    - Use slang when it fits (pull up, lowkey, fr, etc.).
    - Make them want to reply or blush.
    - No emojis (unless already in the prompt).`
        },
        {
          role: "user",
          content: promptText.replace("REACT:", "").trim()
        }
      ];
    } else {
      // Regular Generate Rizz

    messages = [
      {
        role: "system",
        content: `You are SayRizz — an AI social wingman that generates spicy, confident, and personalized flirty replies for Gen Z texting, based on real situations. You're not a chatbot or assistant, you're writing responses that will be sent directly as DMs, story replies, or texts.

Rules:
- Your tone adapts to the selected vibe: 
  - Sweet 🧁 = smooth and kind
  - Non-Chalant 💀 = cool, confident, effortless
  - Spicy 🌶️ = bold flirty / dirty (depending on spice level)
  - Mysterious 😶‍🌫️ = intriguing, short, alluring
  - Funny 😭 = clever, witty, unexpected

- NEVER sound like an AI or say "here's a message you could use."
- NEVER explain the line. Just drop the one-liner as if you’re texting it.
- KEEP IT SHORT. Max 1–2 sentences, under 20 words.
- NO emojis, unless explicitly asked.
- NO greetings like "hey," "hi," or "hello."
- Don't repeat the prompt or rephrase the situation — just respond in character.
- ALWAYS personalize your response to the user's situation (text or screenshot).
- Prioritize flirty, smooth, and viral energy, like something that would go viral on TikTok for being confident or funny.
- Don't overuse cheesy pickup lines. Use them cleverly or remix them.
- Use slang, but keep it natural and current (Gen Z tone).
- DO NOT use hyphens like "—" or "-" to list things or format. Write like you’re texting, use commas or natural punctuation.

The vibe and tone matter most. Make the person want to reply or blush.
`
      }
    ];
    }


    if (image) {
      const base64Image = fs.readFileSync(image.path, { encoding: 'base64' });
      messages.push({
        role: 'user',
        content: [
          { type: "text", text: promptText },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      });
    } else {
      messages.push({ role: "user", content: promptText });
    }

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 100
    });

    res.json({ result: chatCompletion.choices[0].message.content });

  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message || error);
    res.status(500).json({ error: "Failed to generate rizz." });
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: 'price_1RDB2SD3kaTCsTeIC2WnoaZr',
        quantity: 1
      }],
      success_url: 'https://sayrizz.com/success',
      cancel_url: 'https://sayrizz.com/cancel'
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.get('/', (req, res) => {
  res.send('🎉 SayRizz backend is live!');
});


app.get('/ping', (req, res) => {
  res.send('Pong!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});