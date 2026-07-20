import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './config'

export const DEFAULT_LEVELS = {
  weeklyHigh: '',
  weeklyLow: '',
  weeklyOpen: '',
  weeklyPeriodId: '',
  dailyHigh: '',
  dailyLow: '',
  dailyOpen: '',
  dailyPeriodId: '',
  bias: 'neutral',
  supplyZones: [],
  demandZones: [],
  notes: '',
}

export function subscribeLevels(uid, pair, callback, onError) {
  const ref = doc(db, 'users', uid, 'levels', pair)
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_LEVELS, ...snap.data() })
      } else {
        callback(DEFAULT_LEVELS)
      }
    },
    (error) => {
      onError?.(error.message || 'Failed to load levels.')
    },
  )
}

export async function saveLevels(uid, pair, data) {
  try {
    const ref = doc(db, 'users', uid, 'levels', pair)
    await setDoc(ref, data, { merge: true })
  } catch (error) {
    throw new Error(error.message || 'Failed to save levels.')
  }
}
