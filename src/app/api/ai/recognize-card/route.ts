import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';

export const maxDuration = 60; // Set max duration to 60 seconds to prevent timeout during AI processing

function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return new OpenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid image data' }, { status: 400 });
    }

    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: 'Invalid base64 image format' }, { status: 400 });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const prompt = `
Please extract the business card information from the provided image and return it STRICTLY as a JSON object.
IMPORTANT: You MUST extract the exact original text in its original language (e.g., Traditional Chinese). DO NOT translate or transliterate names, job titles, or company names into English. Keep the exact characters as seen in the image.
Do NOT wrap the output in markdown code blocks (\`\`\`json) or add any extra text. Just output the raw JSON object.
If a field is not found or unclear, leave it as an empty string ("").

Required JSON format:
{
  "name": "string (the person's full name in original language)",
  "jobTitle": "string (the person's job title in original language)",
  "email": "string (the email address)",
  "phone": "string (the phone number)",
  "companyName": "string (the company name in original language)",
  "website": "string (the website URL)"
}
`;

    const aiProviderSetting = await prisma.systemSetting.findUnique({ where: { key: 'AI_PROVIDER' } });
    const provider = aiProviderSetting?.value || 'gemini';

    let text = '';

    if (provider === 'openai') {
      const openai = getOpenAI();
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      text = response.choices[0]?.message?.content || '';
    } else {
      // Default to Gemini
      const genAI = getGeminiAI();
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType
        }
      };

      const modelNames = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
      let result;
      let lastError;

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const res = await model.generateContent([prompt, imagePart]);
          result = res;
          break;
        } catch (err: any) {
          console.warn(`Model ${modelName} failed:`, err.message);
          lastError = err;
        }
      }

      if (!result) {
        throw new Error(lastError?.message || 'All Gemini models failed to generate content');
      }

      const response = await result.response;
      text = response.text();
    }

    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const parsedData = JSON.parse(text);
      console.log(`[${provider}] AI Parsed Data:`, parsedData);
      return NextResponse.json({ success: true, data: parsedData, raw: text });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', text);
      return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in recognize-card API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
