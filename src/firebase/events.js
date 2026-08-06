import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './config'

export function subscribeEvents(uid, callback, onError) {
  const q = query(collection(db, 'users', uid, 'events'), orderBy('date', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(events)
    },
    (error) => {
      onError?.(error.message || 'Failed to load events.')
    },
  )
}

export async function addEvent(uid, data) {
  try {
    const ref = collection(db, 'users', uid, 'events')
    const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
    return docRef.id
  } catch (error) {
    throw new Error(error.message || 'Failed to save event.')
  }
}

export async function updateEvent(uid, eventId, data) {
  try {
    await updateDoc(doc(db, 'users', uid, 'events', eventId), data)
  } catch (error) {
    throw new Error(error.message || 'Failed to update event.')
  }
}

export async function deleteEvent(uid, eventId) {
  try {
    await deleteDoc(doc(db, 'users', uid, 'events', eventId))
  } catch (error) {
    throw new Error(error.message || 'Failed to delete event.')
  }
}
