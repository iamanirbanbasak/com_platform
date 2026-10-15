import { describe, expect, it } from 'vitest'

import { safeRedirect } from '@/lib/safe-redirect'

describe('safeRedirect', () => {
  it('keeps same-site paths with their query and hash', () => {
    expect(safeRedirect('/join/ABCD-EFGH-JK')).toBe('/join/ABCD-EFGH-JK')
    expect(safeRedirect('/clubs?tab=events#top')).toBe('/clubs?tab=events#top')
  })

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '/.//evil.com',
    '/..//evil.com',
    '/a/..//evil.com',
    '/%2e//evil.com',
    '\\\\evil.com',
    'javascript:alert(1)',
    '',
    null,
    undefined,
  ])('rejects %j', (target) => {
    expect(safeRedirect(target)).toBe('/')
  })
})
