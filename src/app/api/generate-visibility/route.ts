import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { product, sector, description } = await request.json();

    const prompt = `Generate four different types of marketing content for this product:
- A professional SEO-friendly English product description (150-200 words)
- A LinkedIn announcement post (professional tone, 2-3 paragraphs)
- An eBay product listing with bullet points and highlights
- A polite cold-email pitch to send to potential B2B buyers in the UK

Product Name: ${product}
Sector: ${sector}
Description: ${description}

Format the response as a JSON object with these fields:
{
  "seoDescription": string,
  "linkedinPost": string,
  "ebayListing": string,
  "emailPitch": string
}

Make the content engaging, professional, and tailored to each platform's style.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional marketing copywriter specializing in B2B products. Create engaging, platform-specific content that highlights product benefits and value proposition."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    const content = JSON.parse(response);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error generating visibility content:', error);
    return NextResponse.json(
      { error: 'Failed to generate visibility content' },
      { status: 500 }
    );
  }
} 