export const currencyKey = 'sugargoo.currency'
export const cny = { code: 'CNY', symbol: '￥', rate: '1', front: 1, status: 1 }

export function validCurrencies(data) {
  return Array.isArray(data)
    ? data.filter(
        (item) =>
          item &&
          typeof item.code === 'string' &&
          typeof item.symbol === 'string' &&
          item.front === 1 &&
          item.status === 1 &&
          Number.isFinite(Number(item.rate)) &&
          Number(item.rate) > 0,
      )
    : []
}

export function formatPrice(amount, currency = cny) {
  if (amount == null || amount === '' || !['number', 'string'].includes(typeof amount)) return '—'
  const value = Number(amount)
  const rate = Number(currency.rate)
  if (!Number.isFinite(value) || !Number.isFinite(rate) || rate <= 0) return '—'
  const converted = value * rate
  if (!Number.isFinite(converted)) return '—'
  return `${currency.symbol}${converted.toFixed(2)}`
}
