export type AppearancePreference = 'light' | 'dark' | 'system'
export type ResolvedAppearance = 'light' | 'dark'

export const APPEARANCE_STORAGE_KEY = 'onedayos.appearance'
export const LEGACY_THEME_STORAGE_KEY = 'onedayos-theme'
export const APPEARANCE_PREFERENCES: AppearancePreference[] = ['light', 'dark', 'system']

export const THEME_STORAGE_KEY = APPEARANCE_STORAGE_KEY
export const THEME_PREFERENCES = APPEARANCE_PREFERENCES

export type ThemePreference = AppearancePreference
export type ResolvedTheme = ResolvedAppearance

const systemQuery = '(prefers-color-scheme: dark)'

export function isAppearancePreference(value: unknown): value is AppearancePreference {
  return typeof value === 'string' && APPEARANCE_PREFERENCES.includes(value as AppearancePreference)
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return isAppearancePreference(value)
}

export function getAppearanceInitScript() {
  return `
(function() {
  try {
    var key = '${APPEARANCE_STORAGE_KEY}';
    var legacyKey = '${LEGACY_THEME_STORAGE_KEY}';
    var stored;
    try {
      stored = window.localStorage.getItem(key);
      if (stored !== 'light' && stored !== 'dark' && stored !== 'system') {
        stored = window.localStorage.getItem(legacyKey);
      }
    } catch (storageError) {
      stored = null;
    }
    var preference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var systemDark = false;
    try {
      systemDark = !!(window.matchMedia && window.matchMedia('${systemQuery}').matches);
    } catch (mediaError) {}
    var resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
    var root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.setAttribute('data-appearance', preference);
    root.setAttribute('data-resolved-appearance', resolved);
    root.style.colorScheme = resolved;
  } catch (error) {}
})();`
}

export function getThemeInitScript() {
  return getAppearanceInitScript()
}
