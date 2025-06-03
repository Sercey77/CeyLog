import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate the response structure
function validateMatchesResponse(data: any): boolean {
  if (!Array.isArray(data)) return false;
  
  return data.every((company: any) => {
    return (
      typeof company.company === 'string' &&
      typeof company.website === 'string' &&
      typeof company.department === 'string' &&
      Array.isArray(company.contacts) &&
      company.contacts.every((contact: any) => (
        typeof contact.name === 'string' &&
        typeof contact.title === 'string' &&
        typeof contact.linkedin === 'string' &&
        (!contact.email || typeof contact.email === 'string') &&
        contact.name.length > 0 &&
        contact.title.length > 0 &&
        contact.linkedin.length > 0
      ))
    );
  });
}

// Format the response to ensure consistent structure
function formatMatchesResponse(data: any) {
  if (!Array.isArray(data)) return [];

  return data.map((company: any) => ({
    company: company.company.trim(),
    website: company.website.trim(),
    department: company.department.trim(),
    contacts: company.contacts.map((contact: any) => ({
      name: contact.name.trim(),
      title: contact.title.trim(),
      linkedin: contact.linkedin.trim(),
      email: contact.email ? contact.email.trim() : undefined
    }))
  }));
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

    if (typeof name !== 'string' || typeof description !== 'string' || typeof sector !== 'string') {
      return NextResponse.json(
        { error: 'Invalid field types: name, description, and sector must be strings' },
        { status: 400 }
      );
    }

    if (name.length > 200 || description.length > 1000 || sector.length > 100) {
      return NextResponse.json(
        { error: 'Field length exceeds maximum allowed' },
        { status: 400 }
      );
    }

    const prompt = `Given the following product details:

Product: ${name}
Sector: ${sector}
Description: ${description}

List 5 UK-based B2B companies that may be interested in buying or distributing this product.

For each company, provide:
• Company Name
• Company Website
• Department or Relevant Role (e.g., Procurement, Supply Chain, Purchasing)
• If possible, 1 or 2 contacts (with):
  • Full Name
  • Job Title
  • LinkedIn Profile URL
  • Email (if available)

Focus on companies that:
1. Are actively involved in international trade
2. Have a history of importing similar products
3. Are in a position to make purchasing decisions
4. Have shown interest in products from your region
5. Have a track record of successful partnerships
6. Are actively growing or expanding their operations

Return in JSON format like:
[
  {
    "company": "FleetFix UK",
    "website": "https://fleetfix.co.uk",
    "department": "Procurement",
    "contacts": [
      {
        "name": "Emily Thomas",
        "title": "Procurement Manager",
        "linkedin": "https://www.linkedin.com/in/emilythomas",
        "email": "emily@fleetfix.co.uk"
      }
    ]
  }
]

Ensure all company information is accurate and up-to-date.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert in international trade and business matchmaking, specializing in connecting suppliers with UK-based buyers. Your responses should be factual, professional, and focused on real business opportunities. Always provide accurate and verifiable information about companies and their representatives."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = JSON.parse(completion.choices[0].message.content || '[]');

    if (!validateMatchesResponse(response)) {
      throw new Error('Invalid response format from OpenAI');
    }

    const formattedResponse = formatMatchesResponse(response);

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Error generating buyer matches:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid response format')) {
        return NextResponse.json(
          { error: 'Failed to generate valid buyer matches. Please try again.' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate buyer matches. Please try again later.' },
      { status: 500 }
    );
  }
} 