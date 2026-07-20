import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from './config'

export function subscribeTrades(uid, callback, onError) {
  const q = query(collection(db, 'users', uid, 'trades'), orderBy('date', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const trades = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(trades)
    },
    (error) => {
      onError?.(error.message || 'Failed to load trades.')
    },
  )
}

export function subscribeTrade(uid, tradeId, callback, onError) {
  const tradeRef = doc(db, 'users', uid, 'trades', tradeId)
  return onSnapshot(
    tradeRef,
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    },
    (error) => {
      onError?.(error.message || 'Failed to load trade.')
    },
  )
}

export async function addTrade(uid, data) {
  try {
    const ref = collection(db, 'users', uid, 'trades')
    const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
    return docRef.id
  } catch (error) {
    throw new Error(error.message || 'Failed to save trade.')
  }
}

export async function updateTrade(uid, tradeId, data) {
  try {
    const tradeRef = doc(db, 'users', uid, 'trades', tradeId)
    await updateDoc(tradeRef, data)
  } catch (error) {
    throw new Error(error.message || 'Failed to update trade.')
  }
}

export async function deleteTrade(uid, tradeId) {
  try {
    const tradeRef = doc(db, 'users', uid, 'trades', tradeId)
    await deleteDoc(tradeRef)
  } catch (error) {
    throw new Error(error.message || 'Failed to delete trade.')
  }
}

export async function uploadTradeScreenshot(uid, tradeId, file, kind = 'entry') {
  try {
    const path = `users/${uid}/screenshots/${tradeId}-${kind}-${Date.now()}-${file.name}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  } catch (error) {
    throw new Error(error.message || 'Failed to upload screenshot.')
  }
}
