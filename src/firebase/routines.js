import { collection, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from './config'

export function subscribeRoutine(uid, date, callback, onError) {
  const ref = doc(db, 'users', uid, 'routines', date)
  return onSnapshot(
    ref,
    (snap) => {
      callback(snap.exists() ? snap.data() : null)
    },
    (error) => {
      onError?.(error.message || 'Failed to load routine.')
    },
  )
}

export async function saveRoutine(uid, date, data) {
  try {
    const ref = doc(db, 'users', uid, 'routines', date)
    await setDoc(ref, data, { merge: true })
  } catch (error) {
    throw new Error(error.message || 'Failed to save routine.')
  }
}

export function subscribeRoutineHistory(uid, callback, onError) {
  const q = query(collection(db, 'users', uid, 'routines'), orderBy('__name__', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const routines = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(routines)
    },
    (error) => {
      onError?.(error.message || 'Failed to load routine history.')
    },
  )
}
