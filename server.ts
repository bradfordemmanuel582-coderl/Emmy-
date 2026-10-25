import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import * as archiverModule from 'archiver';
const ZipArchive = (archiverModule as any).ZipArchive || (archiverModule as any).default;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
  images?: Array<{
    data: string; // base64
    mimeType: string;
  }>;
}

// System prompt enhancer for Legend AI Assistant + Chart visualization
const DEFAULT_SYSTEM_INSTRUCTION = `You are Legend AI Assistant, an advanced, highly intelligent, friendly, and capable AI assistant inspired by ChatGPT, enhanced with powerful data analysis and interactive visualization capabilities.

Key guidelines:
1. Formatting: Use clean GitHub Flavored Markdown. Format headers (##, ###), lists, bold, italics, tables, and blockquotes cleanly.
2. Code Blocks: Always specify the programming language tag (e.g. \`\`\`python, \`\`\`javascript, \`\`\`sql, \`\`\`html, \`\`\`css, \`\`\`bash). Provide clear, production-grade code.
3. Chart Visualization Capability:
Whenever the user asks for charts, comparisons, metrics, trends, breakdowns, or whenever data is best explained visually, generate an interactive chart using a \`\`\`chart code block with valid JSON inside.
Supported chart schema:
\`\`\`chart
{
  "type": "bar" | "line" | "area" | "pie" | "donut",
  "title": "Descriptive Chart Title",
  "xAxisLabel": "X Axis Label",
  "yAxisLabel": "Y Axis Label",
  "labels": ["Label1", "Label2", "Label3"],
  "datasets": [
    {
      "label": "Metric Name",
      "data": [10, 25, 42],
      "color": "#10b981"
    }
  ],
  "summary": "Brief 1-sentence insight or key takeaway from the chart."
}
\`\`\`
Use high-contrast vibrant colors like #3b82f6 (blue), #10b981 (emerald), #8b5cf6 (violet), #f59e0b (amber), #ec4899 (pink), #06b6d4 (cyan).
Feel free to provide the chart alongside your textual explanation and markdown tables.

4. Tone & Style: Be concise, articulate, thoughtful, and helpful. If questions are ambiguous, provide the most plausible helpful answer and offer relevant next steps.
`;

// Stream chat completion endpoint
app.post('/api/chat/stream', async (req, res) => {
  const {
    messages = [],
    systemInstruction,
    enableSearch = false,
    temperature = 0.7,
  } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.',
    });
    return;
  }

  try {
    // Convert client messages to Gemini content format
    const contents = (messages as ChatMessage[]).map((msg) => {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: any[] = [];

      // Add attached images if any (multimodal vision)
      if (msg.images && msg.images.length > 0) {
        for (const img of msg.images) {
          // Remove potential data url prefix
          const base64Data = img.data.includes('base64,')
            ? img.data.split('base64,')[1]
            : img.data;
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: img.mimeType || 'image/png',
            },
          });
        }
      }

      // Add text part
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      return { role, parts };
    });

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const fullSystemInstruction = systemInstruction
      ? `${DEFAULT_SYSTEM_INSTRUCTION}\n\nAdditional user-defined instructions:\n${systemInstruction}`
      : DEFAULT_SYSTEM_INSTRUCTION;

    const toolsConfig: any[] = [];
    if (enableSearch) {
      toolsConfig.push({ googleSearch: {} });
    }

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
        tools: toolsConfig.length > 0 ? toolsConfig : undefined,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      const candidate = chunk.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      const payload = {
        text,
        grounding: groundingMetadata
          ? {
              webSearchQueries: groundingMetadata.webSearchQueries || [],
              groundingChunks: (groundingMetadata.groundingChunks || []).map(
                (c: any) => ({
                  web: c.web ? { uri: c.web.uri, title: c.web.title } : undefined,
                })
              ),
            }
          : undefined,
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error generating chat stream:', error);
    const errorMessage = error?.message || 'Failed to generate response';
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// Text-to-Speech endpoint using gemini-3.8-flash-lite-tts
app.post('/api/chat/tts', async (req, res) => {
  const { text, voice = 'Kore' } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text is required for TTS' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    return;
  }

  try {
    // Truncate to reasonable TTS length if very long
    const cleanText = text.replace(/```[\s\S]*?```/g, ' [Code snippet omitted for speech] ').slice(0, 1500);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Natural, friendly, and engaging conversational tone',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({ error: 'No audio returned from Gemini TTS' });
      return;
    }

    res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
});

// Endpoint to return public application URLs
app.get('/api/app-info', (_req, res) => {
  const sharedUrl =
    process.env.APP_URL ||
    'https://ais-pre-5oj2bbxqgpcglrli4d6sf3-704594379291.europe-west1.run.app';
  res.json({ sharedUrl });
});

// Endpoint to download the entire project as a ZIP archive
app.get('/api/project/download-zip', (_req, res) => {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="legend-ai-assistant.zip"');

  const archive =
    typeof ZipArchive === 'function' && ZipArchive.prototype
      ? new ZipArchive({ zlib: { level: 9 } })
      : (archiverModule as any)('zip', { zlib: { level: 9 } });

  archive.on('error', (err: any) => {
    console.error('Archive error:', err);
    if (!res.headersSent) {
      res.status(500).send({ error: err.message });
    }
  });

  archive.pipe(res);

  // Add files from workspace, excluding node_modules, dist, .git
  archive.glob('**/*', {
    cwd: __dirname,
    ignore: ['node_modules/**', 'dist/**', '.git/**', '.cache/**', 'dist.zip'],
    dot: true,
  });

  archive.finalize();
});

// Dev and Prod Vite server mounting
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Legend AI Assistant server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
