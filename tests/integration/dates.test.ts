import { describe, expect, it } from 'vitest'

import { parseLocalDateTime, toLocalDateTimeInput } from '@/lib/dates'

describe('app timezone dates', () => {
  it('parses datetime-local input as wall-clock time in the given zone', () => {
    expect(parseLocalDateTime('2026-10-20T18:00', 'Asia/Kolkata')?.toISOString()).toBe(
      '2026-10-20T12:30:00.000Z',
    )
    expect(parseLocalDateTime('2026-07-01T09:15', 'America/New_York')?.toISOString()).toBe(
      '2026-07-01T13:15:00.000Z',
    )
    expect(parseLocalDateTime('2026-01-01T09:15', 'America/New_York')?.toISOString()).toBe(
      '2026-01-01T14:15:00.000Z',
    )
    expect(parseLocalDateTime('not a date')).toBeNull()
  })

  it('round-trips through the input format', () => {
    const date = new Date('2026-03-29T01:30:00.000Z')
    for (const zone of ['UTC', 'Asia/Kolkata', 'Europe/London', 'America/Los_Angeles']) {
      const input = toLocalDateTimeInput(date, zone)
      expect(parseLocalDateTime(input, zone)?.toISOString()).toBe(date.toISOString())
    }
  })
})
