import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

export function subscribeTransactions(uid, callback, onError) {
  const q = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const transactions = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(transactions)
    },
    (error) => {
      onError?.(error.message || 'Failed to load transactions.')
    },
  )
}

export async function addTransaction(uid, data) {
  try {
    const ref = collection(db, 'users', uid, 'transactions')
    const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
    return docRef.id
  } catch (error) {
    throw new Error(error.message || 'Failed to save transaction.')
  }
}

export async function deleteTransaction(uid, transactionId) {
  try {
    const ref = doc(db, 'users', uid, 'transactions', transactionId)
    await deleteDoc(ref)
  } catch (error) {
    throw new Error(error.message || 'Failed to delete transaction.')
  }
}
