import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      accountType: 'demo', // 'demo' | 'live'
      setAccountType: (accountType) => set({ accountType }),

      user: null,
      setUser: (user) => set({ user }),

      profile: null,
      setProfile: (profile) => set({ profile }),

      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'tradeflow-app-store',
      partialize: (state) => ({ accountType: state.accountType }),
    },
  ),
)
