import { messages } from './messages.js'

export const languages = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' },
  { code: 'es-ES', label: 'Español' },
]
export const languageKey = 'sugargoo.language'
let language = 'en-US'

export function normalizeLanguage(value = '') {
  const prefix = String(value)
    .toLowerCase()
    .split(/[-_,;]/)[0]
  return languages.find((item) => item.code.toLowerCase().startsWith(prefix + '-'))?.code
}

export function translate(text, locale = language, params = {}) {
  const translated =
    locale === 'zh-CN' ? text : messages[text]?.[locale === 'es-ES' ? 1 : 0] || text
  return translated.replace(/\{(\w+)\}/g, (match, key) => params[key] ?? match)
}

export const t = (text, params) => translate(text, language, params)
export const getLanguage = () => language

export function readPreference(key) {
  try {
    const value = globalThis.localStorage?.getItem(key)
    if (value) return value
  } catch {
    // Fall back to session storage when persistent storage is blocked.
  }
  try {
    return globalThis.sessionStorage?.getItem(key) || null
  } catch {
    return null
  }
}

export function savePreference(key, value) {
  try {
    globalThis.localStorage?.setItem(key, value)
  } catch {
    // Fall back to session storage when persistent storage is blocked.
  }
  try {
    globalThis.sessionStorage?.setItem(key, value)
  } catch {
    // Restricted browsers can still use the current page's settings.
  }
}

const spanishCountries = new Set(
  'ES MX AR BO CL CO CR CU DO EC GQ GT HN NI PA PE PR PY SV UY VE'.split(' '),
)

export function languageForCountry(country) {
  if (['CN', 'HK', 'MO', 'TW'].includes(country)) return 'zh-CN'
  return spanishCountries.has(country) ? 'es-ES' : 'en-US'
}

export async function initializeLanguage({
  cached = readPreference(languageKey),
  browserLanguages = globalThis.navigator?.languages || [],
  lookup = () => fetch('https://api.country.is/', { signal: AbortSignal.timeout(3000) }),
} = {}) {
  if (languages.some((item) => item.code === cached)) {
    language = cached
  } else {
    try {
      const response = await lookup()
      if (!response.ok) throw new Error('Country lookup failed')
      const data = await response.json()
      if (!/^[A-Z]{2}$/.test(data.country)) throw new Error('Invalid country')
      language = languageForCountry(data.country)
    } catch {
      language = browserLanguages.map(normalizeLanguage).find(Boolean) || 'en-US'
    }
    savePreference(languageKey, language)
  }
  if (globalThis.document) document.documentElement.lang = language
  return language
}

export function changeLanguage(next, reload = () => globalThis.location.reload()) {
  if (next === language || !languages.some((item) => item.code === next)) return
  savePreference(languageKey, next)
  language = next
  reload()
}
