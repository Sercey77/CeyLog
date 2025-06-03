import { 
  Timestamp, 
  doc, 
  collection, 
  setDoc, 
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

// User Types
export type UserType = 'supplier' | 'buyer';

export interface User {
  uid: string;
  email: string;
  company: string;
  sector: string;
  userType: UserType;
  createdAt: Timestamp;
}

// Product Types
export interface Product {
  name: string;
  description: string;
  price: number;
  sector: string;
  createdBy: string; // user uid
  createdAt: Timestamp;
}

// Market Report Types
export interface MarketReport {
  productId: string;
  analysisText: string;
  generatedAt: Timestamp;
}

// Matchmaking Report Types
export interface MatchedBuyer {
  name: string;
  website: string;
  email?: string;
}

export interface MatchmakingReport {
  productId: string;
  matchedBuyers: MatchedBuyer[];
  generatedAt: Timestamp;
}

// Visibility Report Types
export interface VisibilityReport {
  productId: string;
  seoText: string;
  linkedinPost: string;
  ebayListing: string;
  emailPitch: string;
  generatedAt: Timestamp;
}

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  MARKET_REPORTS: 'marketReports',
  MATCHMAKING_REPORTS: 'matchmakingReports',
  VISIBILITY_REPORTS: 'visibilityReports',
} as const;

// Firestore Security Rules
export const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        request.auth.token.email == 'admin@ceylanlogistics.com';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isSupplier() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'supplier';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Products collection
    match /products/{productId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.createdBy) || isAdmin();
      allow delete: if isOwner(resource.data.createdBy) || isAdmin();
    }

    // Market Reports collection
    match /marketReports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Matchmaking Reports collection
    match /matchmakingReports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Visibility Reports collection
    match /visibilityReports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
`;

// Helper functions for Firestore operations
export const createUser = async (userData: Omit<User, 'createdAt'>) => {
  const userRef = doc(db, COLLECTIONS.USERS, userData.uid);
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
  });
};

export const createProduct = async (productData: Omit<Product, 'createdAt'>) => {
  const productRef = doc(collection(db, COLLECTIONS.PRODUCTS));
  await setDoc(productRef, {
    ...productData,
    createdAt: serverTimestamp(),
  });
  return productRef.id;
};

export const createMarketReport = async (reportData: Omit<MarketReport, 'generatedAt'>) => {
  const reportRef = doc(collection(db, COLLECTIONS.MARKET_REPORTS));
  await setDoc(reportRef, {
    ...reportData,
    generatedAt: serverTimestamp(),
  });
  return reportRef.id;
};

export const createMatchmakingReport = async (reportData: Omit<MatchmakingReport, 'generatedAt'>) => {
  const reportRef = doc(collection(db, COLLECTIONS.MATCHMAKING_REPORTS));
  await setDoc(reportRef, {
    ...reportData,
    generatedAt: serverTimestamp(),
  });
  return reportRef.id;
};

export const createVisibilityReport = async (reportData: Omit<VisibilityReport, 'generatedAt'>) => {
  const reportRef = doc(collection(db, COLLECTIONS.VISIBILITY_REPORTS));
  await setDoc(reportRef, {
    ...reportData,
    generatedAt: serverTimestamp(),
  });
  return reportRef.id;
};

// Query helpers
export const getUserProducts = (userId: string) => {
  return query(
    collection(db, COLLECTIONS.PRODUCTS),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
};

export const getProductReports = (productId: string) => {
  return {
    marketReports: query(
      collection(db, COLLECTIONS.MARKET_REPORTS),
      where('productId', '==', productId),
      orderBy('generatedAt', 'desc')
    ),
    matchmakingReports: query(
      collection(db, COLLECTIONS.MATCHMAKING_REPORTS),
      where('productId', '==', productId),
      orderBy('generatedAt', 'desc')
    ),
    visibilityReports: query(
      collection(db, COLLECTIONS.VISIBILITY_REPORTS),
      where('productId', '==', productId),
      orderBy('generatedAt', 'desc')
    ),
  };
}; 