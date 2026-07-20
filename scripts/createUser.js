// One-time script to seed the single TradeFlow user in Firebase Auth + Firestore.
// Run manually with: node scripts/createUser.js
// Safe to delete after running once.

import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const EMAIL = process.env.VITE_DEFAULT_EMAIL || 'shahroz@tradeflow.com' // change to whatever you want
const PASSWORD = '#tradeflow123pass' // change this before running
const DISPLAY_NAME = 'Shahroz'

async function main() {
  const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD)
  console.log('User created:', cred.user.uid)

  await setDoc(doc(db, 'users', cred.user.uid, 'profile', 'main'), {
    displayName: DISPLAY_NAME,
    demoBalance: 10000,
    liveBalance: 0,
    riskPercent: 2,
    leverage: 500,
    createdAt: serverTimestamp(),
  })
  console.log('Profile document created.')
  console.log('Add VITE_DEFAULT_EMAIL=' + EMAIL + ' to your .env file.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
