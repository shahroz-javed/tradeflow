import { collection, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from './config'

export function subscribeMonthlyReviews(uid, callback, onError) {
  const q = query(collection(db, 'users', uid, 'monthlyReviews'), orderBy('__name__', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(reviews)
    },
    (error) => {
      onError?.(error.message || 'Failed to load monthly reviews.')
    },
  )
}

export function subscribeMonthlyReview(uid, monthId, callback, onError) {
  const ref = doc(db, 'users', uid, 'monthlyReviews', monthId)
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

export async function saveMonthlyReview(uid, monthId, data) {
  try {
    const ref = doc(db, 'users', uid, 'monthlyReviews', monthId)
    await setDoc(ref, data, { merge: true })
  } catch (error) {
    throw new Error(error.message || 'Failed to save monthly review.')
  }
}
