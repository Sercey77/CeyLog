import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import OpenAI from 'openai';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check user's subscription status
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const createdAt = userData.createdAt?.toDate();
    const now = new Date();
    const trialEndDate = createdAt ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
    const isTrialActive = trialEndDate ? now < trialEndDate : false;

    if (userData.subscription !== 'pro' && !isTrialActive) {
      return NextResponse.json(
        { error: 'This feature requires a Pro subscription or active trial' },
        { status: 403 }
      );
    }

    // Get the product description from the request
    const { productDescription } = await request.json();
    if (!productDescription) {
      return NextResponse.json(
        { error: 'Product description is required' },
        { status: 400 }
      );
    }

    // Generate market analysis using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a market analysis expert specializing in the UK market. 
          Analyze the given product and provide a detailed market analysis including:
          1. Market size estimate
          2. Current market trends
          3. Key competitors
          4. Strategic suggestions for market entry or growth
          
          Format your response as a JSON object with the following structure:
          {
            "marketSize": "string describing market size",
            "trends": ["array of market trends"],
            "competitors": ["array of key competitors"],
            "suggestions": ["array of strategic suggestions"]
          }`
        },
        {
          role: "user",
          content: `Please analyze the following product for the UK market: ${productDescription}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // Save the analysis to Firestore
    const reportsRef = collection(db, 'users', userId, 'marketReports');
    await addDoc(reportsRef, {
      ...analysis,
      productDescription,
      createdAt: serverTimestamp(),
    });

    // Return the analysis with a timestamp
    return NextResponse.json({
      ...analysis,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating market analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate market analysis' },
      { status: 500 }
    );
  }
} 