type DateInput = Date | string | number | null | undefined

function toDate(value: DateInput) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatArabicDate(value: DateInput) {
  const date = toDate(value)
  if (!date) return "-"

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

export function formatArabicDateTime(value: DateInput) {
  const date = toDate(value)
  if (!date) return "-"

  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${formatArabicDate(date)}، ${hours}:${minutes}`
}