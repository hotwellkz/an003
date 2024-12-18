import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function deductTokens(userId: string, currentTokens: number, amount: number) {
  const newTokens = currentTokens - amount;
  await updateDoc(doc(db, 'users', userId), {
    tokens: newTokens
  });
  return newTokens;
}

export async function refundTokens(userId: string, currentTokens: number, amount: number) {
  const refundedTokens = currentTokens + amount;
  await updateDoc(doc(db, 'users', userId), {
    tokens: refundedTokens
  });
  return refundedTokens;
}