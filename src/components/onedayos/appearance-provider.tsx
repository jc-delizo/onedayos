"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  APPEARANCE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  isAppearancePreference,
} from './theme-script'
import type { AppearancePreference, ResolvedAppearance } from './theme-script'

const systemQuery = '(prefers-color-scheme: dark)'

type AppearanceContextValue = {
  preference: AppearancePreference
  resolvedAppearance: ResolvedAppearance
  resolvedTheme: ResolvedAppearance
  setPreference: (preference: AppearancePreference) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function canUseDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function getSystemAppearance(): ResolvedAppearance {
  if (!canUseDom() || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia(systemQuery).matches ? 'dark' : 'light'
}

export function resolveAppearance(preference: AppearancePreference): ResolvedAppearance {
  return preference === 'system' ? getSystemAppearance() : preference
}

export function applyAppearance(preference: AppearancePreference, resolvedAppearance: ResolvedAppearance) {
  if (!canUseDom()) return

  const root = document.documentElement
  root.classList.toggle('dark', resolvedAppearance === 'dark')
  root.setAttribute('data-appearance', preference)
  root.setAttribute('data-resolved-appearance', resolvedAppearance)
  root.style.colorScheme = resolvedAppearance
}

function readStoredPreference(): AppearancePreference {
  if (!canUseDom()) return 'system'

  try {
    const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY)
    if (isAppearancePreference(stored)) return stored

    const legacyStored = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    return isAppearancePreference(legacyStored) ? legacyStored : 'system'
  } catch {
    return 'system'
  }
}

function persistPreference(preference: AppearancePreference) {
  if (!canUseDom()) return

  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, preference)
  } catch {
    // Browser privacy settings can block localStorage. The in-memory preference still applies.
  }
}

function subscribeToSystemAppearance(onChange: () => void) {
  if (!canUseDom() || typeof window.matchMedia !== 'function') return undefined

  const media = window.matchMedia(systemQuery)

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }

  media.addListener?.(onChange)
  return () => media.removeListener?.(onChange)
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const initialPreference = readStoredPreference
  const [preference, setPreferenceState] = useState<AppearancePreference>(initialPreference)
  const [resolvedAppearance, setResolvedAppearance] = useState<ResolvedAppearance>(() => resolveAppearance(initialPreference()))

  const applyPreference = useCallback((nextPreference: AppearancePreference, persist: boolean) => {
    const safePreference = isAppearancePreference(nextPreference) ? nextPreference : 'system'
    const nextResolvedAppearance = resolveAppearance(safePreference)

    setPreferenceState(safePreference)
    setResolvedAppearance(nextResolvedAppearance)
    applyAppearance(safePreference, nextResolvedAppearance)

    if (persist) {
      persistPreference(safePreference)
    }
  }, [])

  useEffect(() => {
    applyAppearance(preference, resolvedAppearance)
  }, [preference, resolvedAppearance])

  useEffect(() => {
    if (preference !== 'system') return undefined

    return subscribeToSystemAppearance(() => {
      const nextResolvedAppearance = resolveAppearance('system')
      setResolvedAppearance(nextResolvedAppearance)
      applyAppearance('system', nextResolvedAppearance)
    })
  }, [preference])

  const value = useMemo<AppearanceContextValue>(
    () => ({
      preference,
      resolvedAppearance,
      resolvedTheme: resolvedAppearance,
      setPreference: (nextPreference) => applyPreference(nextPreference, true),
    }),
    [applyPreference, preference, resolvedAppearance],
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance() {
  const value = useContext(AppearanceContext)

  if (!value) {
    throw new Error('useAppearance must be used within AppearanceProvider.')
  }

  return value
}

export const ThemeProvider = AppearanceProvider
export const useThemePreference = useAppearance
export type ThemeContextValue = AppearanceContextValue
