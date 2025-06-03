import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate the response structure
function validateContentResponse(content: any): content is {
  seoText: string;
  linkedinPost: string;
  ebayListing: string;
  emailPitch: string;
} {
  return (
    content &&
    typeof content.seoText === 'string' &&
    typeof content.linkedinPost === 'string' &&
    typeof content.ebayListing === 'string' &&
    typeof content.emailPitch === 'string' &&
    content.seoText.length > 0 &&
    content.linkedinPost.length > 0 &&
    content.ebayListing.length > 0 &&
    content.emailPitch.length > 0
  );
}

export async function POST(request: Request) {
  try {
    const { name, description, sector } = await request.json();

    if (!name || !description || !sector) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, and sector are required' },
        { status: 400 }
      );
    }

    const prompt = `You are a professional marketing assistant specializing in B2B product marketing and international trade. Generate 4 types of content for the product below:

Product Name: ${name}
Sector: ${sector}
Description: ${description}

Please generate the following content types:

1. SEO-optimized product description (150-200 words):
   - Include relevant keywords naturally
   - Focus on unique selling points
   - Use clear, professional language
   - Optimize for search engines while maintaining readability

2. LinkedIn post (professional and engaging):
   - Start with an attention-grabbing hook
   - Include relevant hashtags
   - Add a call-to-action
   - Keep it professional but conversational
   - Focus on business value and benefits

3. eBay-style product listing:
   - Create a compelling title
   - List key features and specifications
   - Include product benefits
   - Add a brief, engaging description
   - Use bullet points for better readability

4. Cold email to reach out to B2B buyers in the UK market:
   - Professional subject line
   - Personalized introduction
   - Clear value proposition
   - Specific call-to-action
   - Professional sign-off

Return each content piece as a separate string in JSON format:
{
  "seoText": "...",
  "linkedinPost": "...",
  "ebayListing": "...",
  "emailPitch": "..."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional marketing assistant specializing in B2B product marketing and international trade. Your responses should be clear, professional, and optimized for each specific platform."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const content = JSON.parse(response);
    
    if (!validateContentResponse(content)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error generating content:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse OpenAI response' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    );
  }
} 