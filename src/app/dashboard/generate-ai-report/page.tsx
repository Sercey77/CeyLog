import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);

    const body = await req.json();
    const {
      productName, description, category, subcategory, market,
      hsCode, priceRange, imageUrl
    } = body;

    let imageInsights = '';
    if (imageUrl) {
      // Use OpenAI Vision API to analyze image
      const visionRes = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze this product image and provide insights for market analysis. Product: ${productName}, Category: ${category}, Subcategory: ${subcategory || ''}, Description: ${description}` },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000
      });
      imageInsights = visionRes.choices[0].message.content || '';
    }

    // Compose GPT prompt with all info
    const prompt = `
Product Name: ${productName}
Description: ${description}
Category: ${category}
Subcategory: ${subcategory || ''}
Target Market: ${market}
HS Code: ${hsCode || ''}
Price Range: ${priceRange || ''}
${imageInsights ? `Image Insights: ${imageInsights}` : ''}

Generate a detailed market analysis report including:
- Market Trend Analysis
- Competitor Insights
- Growth Opportunities
- Regulatory Considerations (import duties, HS code suggestions for UK)
- Custom Summary and recommendations
`;

    const gptRes = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a market analysis expert for international trade." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1800
    });

    const report = gptRes.choices[0].message.content;

    return NextResponse.json({ report, imageInsights });
  } catch (error: any) {
    console.error('Market Analysis API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}