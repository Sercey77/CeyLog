import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { name, description, sector } = await request.json();

    const prompt = `Analyze the market for the following product:

Product Name: ${name}
Description: ${description}
Sector: ${sector}

Please provide a comprehensive market analysis in the following format:

Market Size: [Provide an estimate of the total market size and potential revenue]
Growth Trends: [Describe current and projected market growth trends]
Key Competitors: [List and analyze main competitors in the market]
Target Markets: [Identify primary and secondary target markets]
Recommendations: [Provide strategic recommendations for market entry and growth]

Make the analysis specific to this product and sector, focusing on actionable insights.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a market analysis expert. Provide detailed, accurate, and actionable market insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const analysis = completion.choices[0].message.content;

    // Parse the analysis into structured sections
    const sections = analysis?.split('\n\n').reduce((acc: any, section) => {
      const [title, content] = section.split(': ');
      if (title && content) {
        const key = title.toLowerCase().replace(/\s+/g, '') as keyof typeof acc;
        acc[key] = content.trim();
      }
      return acc;
    }, {});

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error generating market analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate market analysis' },
      { status: 500 }
    );
  }
} 