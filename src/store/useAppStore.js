import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const ALL_INSTRUMENTS = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF',
  'EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'XAUUSD', 'XAGUSD',
  'US30', 'NAS100', 'SPX500', 'DAX40', 'FTSE100', 'NK225',
]

export const useAppStore = create(
  persist(
    (set) => ({
      accountType: 'demo',
      setAccountType: (accountType) => set({ accountType }),

      user: null,
      setUser: (user) => set({ user }),

      profile: null,
      setProfile: (profile) => set({ profile }),

      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      theme: 'default',
      setTheme: (theme) => set({ theme }),

      favoriteInstruments: [],
      setFavoriteInstruments: (favoriteInstruments) => set({ favoriteInstruments }),
      toggleFavoriteInstrument: (instrument) => set((state) => ({
        favoriteInstruments: state.favoriteInstruments.includes(instrument)
          ? state.favoriteInstruments.filter((i) => i !== instrument)
          : [...state.favoriteInstruments, instrument],
      })),
    }),
    {
      name: 'tradeflow-app-store',
      partialize: (state) => ({
        accountType: state.accountType,
        theme: state.theme,
        favoriteInstruments: state.favoriteInstruments,
      }),
    },
  ),
)
