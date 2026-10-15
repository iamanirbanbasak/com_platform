/**
 * All dates are shown and entered in one organisation-wide timezone, so an event
 * typed as 18:00 means 18:00 for everyone regardless of where the server runs.
 */
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'UTC'

function formatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en', { ...options, timeZone: APP_TIMEZONE })
}

const date = formatter({ dateStyle: 'medium' })
const dateTime = formatter({ dateStyle: 'medium', timeStyle: 'short' })
const time = formatter({ timeStyle: 'short' })
const month = formatter({ month: 'short' })
const monthYear = formatter({ month: 'long', year: 'numeric' })
const weekday = formatter({ weekday: 'short' })
const day = formatter({ day: 'numeric' })

export const formatDate = (value: Date) => date.format(value)
export const formatDateTime = (value: Date) => dateTime.format(value)
export const formatTime = (value: Date) => time.format(value)
export const formatMonth = (value: Date) => month.format(value)
export const formatMonthYear = (value: Date) => monthYear.format(value)
export const formatWeekday = (value: Date) => weekday.format(value)
export const formatDay = (value: Date) => day.format(value)

type WallClock = { year: number; month: number; day: number; hour: number; minute: number }

function wallClock(value: Date, timeZone: string): WallClock & { second: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(value)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

function offsetMs(value: Date, timeZone: string): number {
  const wall = wallClock(value, timeZone)
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  return asUtc - Math.floor(value.getTime() / 1000) * 1000
}

/** Parses a `datetime-local` value ("2026-10-20T18:00") as wall-clock time in the app timezone. */
export function parseLocalDateTime(input: string, timeZone = APP_TIMEZONE): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(input.trim())
  if (!match) return null
  const [, y, mo, d, h, mi] = match.map(Number)
  const naive = Date.UTC(y, mo - 1, d, h, mi)
  const first = naive - offsetMs(new Date(naive), timeZone)
  // Re-check once in case the guess crossed a DST boundary.
  const second = naive - offsetMs(new Date(first), timeZone)
  return new Date(second)
}

/** Formats a date for a `datetime-local` input in the app timezone. */
export function toLocalDateTimeInput(value: Date | null | undefined, timeZone = APP_TIMEZONE) {
  if (!value) return ''
  const wall = wallClock(value, timeZone)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}`
}
