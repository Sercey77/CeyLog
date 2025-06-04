import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import OpenAI from 'openai';
import { getSubscriptionStatus } from '@/lib/subscription';
import { auth } from 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { findHTSMapping, getDefaultHTSMapping } from '@/lib/hmrc-hts-map';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check subscription status
    const { isPro, isTrialActive } = await getSubscriptionStatus(userId);
    if (!isPro && !isTrialActive) {
      return NextResponse.json(
        { message: 'This feature requires a Pro subscription' },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const description = formData.get('description') as string;
    const targetMarket = formData.get('targetMarket') as string;

    if (!image) {
      return NextResponse.json(
        { message: 'Image is required' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Analyze image with OpenAI Vision API
    const imageAnalysis = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product image and provide detailed information in JSON format. Focus on identifying:
              1. Product name and category
              2. Key features and specifications
              3. Materials and construction
              4. Quality indicators
              5. Potential use cases
              6. Estimated price range
              
              Format the response as:
              {
                "productName": "Name of the product",
                "category": "Product category",
                "features": ["List of key features"],
                "materials": ["List of materials used"],
                "quality": "Quality assessment",
                "useCases": ["List of potential use cases"],
                "estimatedPrice": "Estimated price range",
                "confidence": "Confidence level in analysis (high/medium/low)"
              }
              
              Additional context: ${description || 'No additional description provided'}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${image.type};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const productInfo = JSON.parse(imageAnalysis.choices[0].message.content || '{}');

    // Find HTS mapping for the product
    const htsMapping = findHTSMapping(productInfo.category, productInfo.productName) || getDefaultHTSMapping();

    // Generate market analysis using GPT-4
    const marketAnalysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a market analysis expert specializing in ${targetMarket} markets. 
          Provide detailed market analysis in JSON format, focusing on accurate customs information,
          market trends, and actionable insights.`
        },
        {
          role: "user",
          content: `Analyze the following product for the ${targetMarket} market:
          Product Name: ${productInfo.productName}
          Category: ${productInfo.category}
          Features: ${productInfo.features.join(', ')}
          Materials: ${productInfo.materials.join(', ')}
          Quality: ${productInfo.quality}
          Use Cases: ${productInfo.useCases.join(', ')}
          HTS Code: ${htsMapping.code}
          Import Duty: ${htsMapping.importDuty}%
          VAT: ${htsMapping.vat}%
          
          Provide a detailed market analysis in JSON format with the following structure:
          {
            "priceRange": {
              "min": "Minimum price",
              "max": "Maximum price",
              "currency": "Currency code",
              "notes": "Price range justification"
            },
            "marketTrends": {
              "demand": "Current market demand level",
              "growth": "Expected growth rate",
              "competition": "Competition level"
            },
            "targetDemographics": [
              {
                "segment": "Demographic segment",
                "reasoning": "Why this segment is suitable",
                "channels": ["Recommended channels for this segment"]
              }
            ],
            "suggestedChannels": [
              {
                "channel": "Channel name",
                "reasoning": "Why this channel is suitable",
                "estimatedReach": "Estimated reach"
              }
            ],
            "positioningTips": [
              {
                "tip": "Positioning tip",
                "implementation": "How to implement this tip",
                "expectedImpact": "Expected impact"
              }
            ],
            "regulatoryNotes": "Any important regulatory considerations",
            "marketEntryStrategy": "Recommended market entry strategy"
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const marketInfo = JSON.parse(marketAnalysis.choices[0].message.content || '{}');

    // Combine the analysis results
    const report = {
      ...productInfo,
      htsCode: htsMapping.code,
      importDuty: htsMapping.importDuty,
      vat: htsMapping.vat,
      taxExemptions: htsMapping.exemptions,
      regulatoryNotes: htsMapping.notes,
      ...marketInfo,
      timestamp: new Date().toISOString(),
      targetMarket
    };

    // Save report to Firestore
    await addDoc(collection(db, 'users', userId, 'imageReports'), {
      ...report,
      createdAt: serverTimestamp(),
      imageUrl: null, // We don't store the actual image
      imageType: image.type,
      imageSize: image.size
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating image report:', error);
    return NextResponse.json(
      { message: 'Failed to generate report' },
      { status: 500 }
    );
  }
} 