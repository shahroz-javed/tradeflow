import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth'
import { auth } from './config'

function friendlyAuthError(error) {
  const code = error?.code || ''
  const map = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
  }
  return map[code] || error?.message || 'Something went wrong. Please try again.'
}

export async function signIn(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  } catch (error) {
    throw new Error(friendlyAuthError(error))
  }
}

export async function signOutUser() {
  try {
    await signOut(auth)
  } catch (error) {
    throw new Error(friendlyAuthError(error))
  }
}

export async function changePassword(newPassword) {
  try {
    if (!auth.currentUser) throw new Error('You must be logged in to do this.')
    await updatePassword(auth.currentUser, newPassword)
  } catch (error) {
    throw new Error(friendlyAuthError(error))
  }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}
