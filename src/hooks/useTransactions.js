import { useEffect, useState } from 'react'
import { addTransaction, deleteTransaction, subscribeTransactions } from '../firebase/transactions'
import { useAppStore } from '../store/useAppStore'

export function useTransactions() {
  const currentUser = useAppStore((s) => s.user)
  const [allTransactions, setAllTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      setAllTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeTransactions(
      currentUser.uid,
      (data) => {
        setAllTransactions(data)
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [currentUser])

  async function create(data) {
    if (!currentUser) return
    try {
      await addTransaction(currentUser.uid, data)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function remove(transactionId) {
    if (!currentUser) return
    try {
      await deleteTransaction(currentUser.uid, transactionId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return { allTransactions, loading, error, create, remove }
}
