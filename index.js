import multer from 'multer';
import fs from 'fs';
import { OpenAI } from 'openai';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Example endpoint for generating Rizz 🔥

const upload = multer({ dest: 'uploads/' });

app.post('/api/generate', upload.single('image'), async (req, res) => {
  const promptText = req.body.prompt || '';
  const image = req.file;

  try {
    let messages = [
      {
        role: "system",
        content: `
          You are a Gen Z social assistant that crafts short, clever, rizz-packed responses for flirty or awkward situations. 
          Your tone should match the vibe (e.g. savage, sweet, spicy, funny, mysterious).
          You must:
          - Keep it under 20 words
          - No dashes, no robotic structure
          - Make it sound natural, human, and like it could be sent in a DM
          - NEVER use emojis inside the generated message
          - Use slang and casual tone when appropriate
          - Prioritize smooth, subtle, or bold confidence depending on vibe
          - Don't say "Hi", "Hey", or intro phrases. Get to the point.
        `,
      }
    ];

    if (image) {
      const base64Image = fs.readFileSync(image.path, { encoding: 'base64' });

      messages.push({
        role: 'user',
        content: [
          { type: "text", text: promptText || "Analyze this situation and give a rizz response." },
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

    console.log("✅ OpenAI response:", chatCompletion);

    res.json({ result: chatCompletion.choices[0].message.content });

    } catch (error) {
      console.error("OpenAI error:", error.response?.data || error.message || error);
      res.status(500).json({ error: "Failed to generate rizz." });
    }
});


// ✅ Must come BEFORE your routes
app.use(cors({
  origin: "*", // Allow all origins (good for testing)
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"],
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('🎉 SayRizz backend is live!');
});

