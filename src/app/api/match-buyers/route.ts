import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { product, sector, description } = await request.json();

    const prompt = `List UK-based companies or distributors who might be interested in this product:
Product: ${product}
Sector: ${sector}
Description: ${description}

For each company, provide:
1. Company Name
2. Sector Match (how their business aligns with this product)
3. Website (if known)
4. Contact Email (if known)
5. Match Confidence (percentage indicating how likely they are to be interested)

Format the response as a JSON array of objects with these fields:
{
  "companyName": string,
  "sectorMatch": string,
  "website": string (optional),
  "contactEmail": string (optional),
  "confidence": number (0-100)
}

Focus on real, established UK companies in the ${sector} sector.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional business matchmaker specializing in UK markets. Provide accurate, actionable matches with real companies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    const buyers = JSON.parse(response);

    return NextResponse.json({ buyers });
  } catch (error) {
    console.error('Error generating buyer matches:', error);
    return NextResponse.json(
      { error: 'Failed to generate buyer matches' },
      { status: 500 }
    );
  }
} 