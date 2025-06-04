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

interface Contact {
  name: string;
  title: string;
  linkedin: string;
  email?: string;
}

interface Company {
  company: string;
  website: string;
  department: string;
  contacts: Contact[];
}

interface RequestBody {
  name: string;
  description: string;
  sector: string;
}

interface RawContact {
  name: string;
  title: string;
  linkedin: string;
  email?: string;
}

interface RawCompany {
  company: string;
  website: string;
  department: string;
  contacts: RawContact[];
}

// Validate the response structure
function validateMatchesResponse(data: unknown): data is RawCompany[] {
  if (!Array.isArray(data)) return false;
  
  return data.every((company): company is RawCompany => {
    return (
      typeof company.company === 'string' &&
      typeof company.website === 'string' &&
      typeof company.department === 'string' &&
      Array.isArray(company.contacts) &&
      company.contacts.every((contact: unknown): contact is RawContact => {
        if (typeof contact !== 'object' || contact === null) return false;
        const c = contact as Record<string, unknown>;
        return (
          typeof c.name === 'string' &&
          typeof c.title === 'string' &&
          typeof c.linkedin === 'string' &&
          (!c.email || typeof c.email === 'string') &&
          c.name.length > 0 &&
          c.title.length > 0 &&
          c.linkedin.length > 0
        );
      })
    );
  });
}

// Format the response to ensure consistent structure
function formatMatchesResponse(data: unknown): Company[] {
  if (!Array.isArray(data)) return [];

  return data.map((company: unknown) => {
    if (!isRawCompany(company)) return null;
    
    const formattedCompany: Company = {
      company: company.company.trim(),
      website: company.website.trim(),
      department: company.department.trim(),
      contacts: company.contacts
        .map((contact: unknown) => {
          if (!isRawContact(contact)) return null;
          const formattedContact: Contact = {
            name: contact.name.trim(),
            title: contact.title.trim(),
            linkedin: contact.linkedin.trim(),
            email: contact.email ? contact.email.trim() : undefined
          };
          return formattedContact;
        })
        .filter((contact): contact is Contact => contact !== null)
    };
    
    return formattedCompany;
  }).filter((company): company is Company => company !== null);
}

function isRawCompany(value: unknown): value is RawCompany {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.company === 'string' &&
    typeof v.website === 'string' &&
    typeof v.department === 'string' &&
    Array.isArray(v.contacts)
  );
}

function isRawContact(value: unknown): value is RawContact {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === 'string' &&
    typeof v.title === 'string' &&
    typeof v.linkedin === 'string' &&
    (!v.email || typeof v.email === 'string')
  );
}

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

    // Get the industry from the request
    const { industry } = await request.json();
    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      );
    }

    // Generate buyer matches using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a business development expert specializing in B2B sales and lead generation.
          For the given industry, identify potential buyer companies and their key decision-makers.
          Include their roles, LinkedIn profiles (if available), and email addresses (if available).
          Also provide a relevance score for each match.
          
          Format your response as a JSON object with the following structure:
          {
            "matches": [
              {
                "company": "string",
                "role": "string",
                "name": "string",
                "linkedin": "string (optional)",
                "email": "string (optional)",
                "relevance": "string (e.g., 'High', 'Medium', 'Low')"
              }
            ]
          }`
        },
        {
          role: "user",
          content: `Please find potential buyers in the following industry: ${industry}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const matches = JSON.parse(completion.choices[0].message.content || '{"matches": []}');

    // Save the matches to Firestore
    const reportsRef = collection(db, 'users', userId, 'matchmakingReports');
    await addDoc(reportsRef, {
      ...matches,
      industry,
      createdAt: serverTimestamp(),
    });

    // Return the matches with a timestamp
    return NextResponse.json({
      ...matches,
      timestamp: new Date(),
      industry,
    });
  } catch (error) {
    console.error('Error generating buyer matches:', error);
    return NextResponse.json(
      { error: 'Failed to generate buyer matches' },
      { status: 500 }
    );
  }
} 