import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, doc, getFirestore, orderBy, query, serverTimestamp, setDoc, Timestamp, where, getDoc } from "firebase/firestore";
import { request } from "http";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  REPORTS: 'reports',
  VISIBILITY_REPORTS: 'visibilityReports',
  MARKET_REPORTS: 'marketReports',
  BUYER_MATCHES: 'buyerMatches'
} as const;

// User Types
export type UserType = 'supplier' | 'buyer';
export type SubscriptionType = 'free' | 'pro';

export interface User {
  uid: string;
  email: string;
  company: string;
  sector: string;
  userType: UserType;
  subscription: SubscriptionType;
  createdAt: Timestamp;
}

// Helper functions
function isAuthenticated() {
  return auth.currentUser != null;
}

function isAdmin() {
  return isAuthenticated() && 
    auth.currentUser?.email === 'admin@ceylanlogistics.com';
}

export const createUser = async (userData: Omit<User, 'createdAt' | 'subscription'>) => {
  const userRef = doc(db, COLLECTIONS.USERS, userData.uid);
  await setDoc(userRef, {
    ...userData,
    subscription: 'free' as SubscriptionType,
    createdAt: serverTimestamp(),
  });
};

export const getUserProducts = (userId: string) => {
  return query(
    collection(db, COLLECTIONS.PRODUCTS),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
};

// Subscription-related functions
export const getUserSubscription = async (userId: string): Promise<SubscriptionType> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  return userDoc.data().subscription as SubscriptionType;
};

export const updateUserSubscription = async (userId: string, subscription: SubscriptionType) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await setDoc(userRef, { subscription }, { merge: true });
};

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    marketReports: 3,
    matchmakingReports: 2,
    visibilityReports: 2,
    savedReports: 5,
  },
  pro: {
    marketReports: Infinity,
    matchmakingReports: Infinity,
    visibilityReports: Infinity,
    savedReports: Infinity,
  },
} as const;

