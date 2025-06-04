import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function getSubscriptionStatus(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData) {
      return { isPro: false, isTrialActive: false };
    }

    const isPro = userData.subscriptionStatus === 'active';
    const trialEndDate = userData.trialEndDate?.toDate();
    const isTrialActive = trialEndDate ? trialEndDate > new Date() : false;

    return { isPro, isTrialActive };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isPro: false, isTrialActive: false };
  }
} 