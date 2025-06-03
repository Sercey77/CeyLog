import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { product, sector, description } = await request.json();

    const prompt = `Please analyze the market potential for the following product in the UK:
Product: ${product}
Sector: ${sector}
Description: ${description}

Please provide a comprehensive analysis including:
1. Market Trends: Current trends and future outlook
2. Competitors: Main competitors and market positioning
3. Demand Level: Current and projected demand
4. Pricing Analysis: Suggested pricing strategy
5. Target Buyers: Recommended buyer profiles and segments

Format the response in clear paragraphs with proper spacing.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional market analyst specializing in UK markets. Provide detailed, actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const analysis = completion.choices[0]?.message?.content || 'No analysis generated';

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error generating market analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate market analysis' },
      { status: 500 }
    );
  }
} 