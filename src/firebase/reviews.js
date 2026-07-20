import { collection, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from './config'

export function subscribeReviews(uid, callback, onError) {
  const q = query(collection(db, 'users', uid, 'weeklyReviews'), orderBy('__name__', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(reviews)
    },
    (error) => {
      onError?.(error.message || 'Failed to load weekly reviews.')
    },
  )
}

export function subscribeReview(uid, weekId, callback, onError) {
  const ref = doc(db, 'users', uid, 'weeklyReviews', weekId)
  return onSnapshot(
    ref,
    (snap) => {
      callback(snap.exists() ? snap.data() : null)
    },
    (error) => {
      onError?.(error.message || 'Failed to load review.')
    },
  )
}

export async function saveReview(uid, weekId, data) {
  try {
    const ref = doc(db, 'users', uid, 'weeklyReviews', weekId)
    await setDoc(ref, data, { merge: true })
  } catch (error) {
    throw new Error(error.message || 'Failed to save review.')
  }
}
