import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { Timestamp } from 'firebase-admin/firestore';
import { OpenAI } from 'openai';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);
    const userId = decoded.uid;

    // Parse form data
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const market = formData.get('market') as string;
    const priceRange = formData.get('priceRange') as string;
    const keywords = formData.get('keywords') as string;
    const hsCode = formData.get('hsCode') as string;
    const imageFile = formData.get('image') as File | null;

    // Convert image to base64 if present
    let imageBase64 = '';
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(arrayBuffer).toString('base64');
    }

    // Modular AI calls (pseudo, replace with real OpenAI calls)
    const marketTrend = await callOpenAIModule('market trend', { title, description, category, market, imageBase64 });
    const competitorInsights = await callOpenAIModule('competitor insights', { title, description, category, market, imageBase64 });
    const growthOpportunities = await callOpenAIModule('growth opportunities', { title, description, category, market, imageBase64 });
    const customReport = await callOpenAIModule('custom report', { title, description, category, market, imageBase64 });
    const buyerMatching = await callOpenAIModule('buyer matching', { title, description, category, market, imageBase64 });
    const pricingBenchmark = await callOpenAIModule('pricing benchmark', { title, description, category, market, imageBase64 });
    const customsTax = await callOpenAIModule('customs tax', { title, description, category, market, imageBase64, hsCode });
    const visibilityContent = await callOpenAIModule('visibility content', { title, description, category, market, imageBase64 });

    // Store report in Firestore
    const reportData = {
      userId,
      title,
      description,
      category,
      market,
      priceRange,
      keywords,
      hsCode,
      createdAt: Timestamp.now(),
      marketTrend,
      competitorInsights,
      growthOpportunities,
      customReport,
      buyerMatching,
      pricingBenchmark,
      customsTax,
      visibilityContent,
    };
    await db.collection('aiReports').add(reportData);

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error('AI Report Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Example modular OpenAI call (replace with real prompts and logic)
async function callOpenAIModule(type: string, data: any) {
  // You would use openai.chat.completions.create or openai.images.generate here
  // For now, return a placeholder string
  return `[${type.toUpperCase()}] AI-generated content for ${data.title || 'product'}`;
} 