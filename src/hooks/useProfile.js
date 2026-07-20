import { useEffect, useState } from 'react'
import { subscribeProfile, updateProfile as updateProfileDoc } from '../firebase/profile'
import { useAppStore } from '../store/useAppStore'

export function useProfile() {
  const currentUser = useAppStore((s) => s.user)
  const setProfileStore = useAppStore((s) => s.setProfile)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeProfile(
      currentUser.uid,
      (data) => {
        setProfile(data)
        setProfileStore(data)
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [currentUser, setProfileStore])

  async function updateProfile(data) {
    if (!currentUser) return
    try {
      await updateProfileDoc(currentUser.uid, data)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return { profile, loading, error, updateProfile }
}
