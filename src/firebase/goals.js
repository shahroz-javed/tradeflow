import { collection, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from './config'

export function subscribeGoalHistory(uid, callback, onError) {
  const q = query(collection(db, 'users', uid, 'goalHistory'), orderBy('__name__', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    (error) => {
      onError?.(error.message || 'Failed to load goal history.')
    },
  )
}

/** id format: "daily-YYYY-MM-DD" | "weekly-YYYY-WNN" | "monthly-YYYY-MM" */
export async function saveGoalRecord(uid, id, data) {
  try {
    const ref = doc(db, 'users', uid, 'goalHistory', id)
    await setDoc(ref, data, { merge: true })
  } catch (error) {
    throw new Error(error.message || 'Failed to save goal record.')
  }
}
