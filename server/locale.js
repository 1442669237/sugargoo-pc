import resources from './data/locales.json' with { type: 'json' }

const supported = { zh: 'zh-CN', en: 'en-US', es: 'es-ES' }

export function resolveLanguage(header = '') {
  const preferences = String(header)
    .split(',')
    .map((part, index) => {
      const [tag, ...parameters] = part.trim().toLowerCase().split(';')
      const quality = parameters.find((value) => value.trim().startsWith('q='))
      return {
        language: supported[tag.split('-')[0]],
        quality: quality ? Number(quality.trim().slice(2)) : 1,
        index,
      }
    })
    .filter((item) => item.language && item.quality > 0 && item.quality <= 1)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
  return preferences[0]?.language || 'en-US'
}

export const getLocaleData = (language) => resources[language]
