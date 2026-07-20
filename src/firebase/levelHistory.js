import { collection, doc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore'
import { db } from './config'

/** id format: "{pair}-daily-YYYY-MM-DD" | "{pair}-weekly-YYYY-WNN" */
export async function saveLevelHistoryRecord(uid, id, data) {
  try {
    const ref = doc(db, 'users', uid, 'levelHistory', id)
    await setDoc(ref, data, { merge: true })
  } catch (error) {
    throw new Error(error.message || 'Failed to save level history.')
  }
}

/** Fetches the most recent daily and weekly history record for a pair (one-time read, not realtime). */
export async function fetchLatestLevelHistory(uid, pair) {
  try {
    const base = collection(db, 'users', uid, 'levelHistory')

    const dailyQuery = query(
      base,
      where('pair', '==', pair),
      where('period', '==', 'daily'),
      orderBy('periodId', 'desc'),
      limit(1),
    )
    const weeklyQuery = query(
      base,
      where('pair', '==', pair),
      where('period', '==', 'weekly'),
      orderBy('periodId', 'desc'),
      limit(1),
    )

    const [dailySnap, weeklySnap] = await Promise.all([getDocs(dailyQuery), getDocs(weeklyQuery)])

    const previousDay = dailySnap.empty ? null : { id: dailySnap.docs[0].id, ...dailySnap.docs[0].data() }
    const previousWeek = weeklySnap.empty ? null : { id: weeklySnap.docs[0].id, ...weeklySnap.docs[0].data() }

    return { previousDay, previousWeek }
  } catch (error) {
    throw new Error(error.message || 'Failed to load level history.')
  }
}
