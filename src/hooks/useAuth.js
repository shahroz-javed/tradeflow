import { useEffect, useState } from 'react'
import { onAuthChange, signIn, signOutUser } from '../firebase/auth'
import { useAppStore } from '../store/useAppStore'

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const setUser = useAppStore((s) => s.setUser)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user)
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [setUser])

  async function login(email, password) {
    return signIn(email, password)
  }

  async function logout() {
    await signOutUser()
  }

  return { currentUser, loading, login, logout }
}
