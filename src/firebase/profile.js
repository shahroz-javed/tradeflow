import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './config'

const DEFAULT_PROFILE = {
  displayName: '',
  demoBalance: 10000,
  liveBalance: 0,
  riskPercent: 2,
  leverage: 500,
}

export function subscribeProfile(uid, callback, onError) {
  const ref = doc(db, 'users', uid, 'profile', 'main')
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_PROFILE, ...snap.data() })
      } else {
        callback(DEFAULT_PROFILE)
      }
    },
    (error) => {
      onError?.(error.message || 'Failed to load profile.')
    },
  )
}

export async function updateProfile(uid, data) {
  try {
    const ref = doc(db, 'users', uid, 'profile', 'main')
    await setDoc(ref, data, { merge: true })
  } catch (error) {
    throw new Error(error.message || 'Failed to update profile.')
  }
}
