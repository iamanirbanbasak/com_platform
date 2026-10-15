import { expect, test, type Browser, type Page } from '@playwright/test'

const ADMIN = { email: 'admin@e2e.test', password: 'admin-e2e-password' }
const PRESIDENT = { name: 'Priya President', email: 'priya@e2e.test', password: 'priya-password-1' }
const MEMBER = { name: 'Manu Member', email: 'manu@e2e.test', password: 'manu-password-1' }

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext()
  return context.newPage()
}

async function signUp(page: Page, user: typeof PRESIDENT, next?: string) {
  await page.goto(next ? `/sign-up?next=${encodeURIComponent(next)}` : '/sign-up')
  await page.getByLabel('Full name').fill(user.name)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('button', { name: 'Open account menu' })).toBeVisible()
}

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: 'Open account menu' })).toBeVisible()
}

test('admin creates a club, president invites, member joins with a single-use code', async ({
  browser,
}) => {
  // The president needs an account before the admin can appoint them.
  const president = await newPage(browser)
  await signUp(president, PRESIDENT)

  const admin = await newPage(browser)
  await signIn(admin, ADMIN)
  await admin.goto('/admin/clubs')
  await admin.getByLabel('Club name').fill('Chess Society')
  await expect(admin.getByLabel('Page address')).toHaveValue('chess-society')
  await admin.getByLabel('Category').selectOption('Academic')
  await admin.getByLabel('Description').fill('Weekly games and tournaments.')
  await admin.getByLabel("President's email (optional)").fill(PRESIDENT.email)
  await admin.getByRole('button', { name: 'Create club' }).click()
  await expect(admin.getByText('Created Chess Society.')).toBeVisible()
  await expect(admin.getByText(`${PRESIDENT.name} (${PRESIDENT.email})`)).toBeVisible()

  // President posts a members-only update and generates an invite.
  await president.goto('/manage/chess-society/posts')
  await president.getByLabel('Title').fill('Members meeting')
  await president.getByLabel('Post').fill('Strategy session on **Friday**.')
  await president.getByLabel('Who can see this?').selectOption('MEMBERS')
  await president.getByRole('button', { name: 'Publish post' }).click()
  await expect(president.getByText('Post published.')).toBeVisible()

  await president.goto('/manage/chess-society/invites')
  await president.getByRole('button', { name: 'Generate invite' }).click()
  const codeText = president.locator('p.font-mono.text-3xl')
  await expect(codeText).toHaveText(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{2}$/)
  const code = (await codeText.textContent())!.trim()

  // A visitor can't see members-only posts and is asked to sign in to follow.
  const visitor = await newPage(browser)
  await visitor.goto('/clubs/chess-society')
  await expect(visitor.getByRole('heading', { name: 'Chess Society' })).toBeVisible()
  await expect(visitor.getByText('Members meeting')).toHaveCount(0)
  await visitor.getByRole('button', { name: 'Follow' }).click()
  await expect(visitor).toHaveURL(/\/sign-in\?next=%2Fclubs%2Fchess-society/)

  // New member opens the invite link, signs up, and joins.
  const member = await newPage(browser)
  await member.goto(`/join/${code}`)
  await expect(member).toHaveURL(/\/sign-in\?next=/)
  await signUp(member, MEMBER, `/join/${code}`)
  await expect(member).toHaveURL(new RegExp(`/join/${code}`))
  await expect(member.getByRole('heading', { name: 'Join Chess Society' })).toBeVisible()
  await member.getByRole('button', { name: 'Accept and join' }).click()
  await expect(member).toHaveURL(/\/clubs\/chess-society/)
  await expect(member.getByText('Official member')).toBeVisible()
  await expect(member.getByText('Members meeting')).toBeVisible()

  await member.getByRole('button', { name: 'Follow' }).click()
  await expect(member.getByRole('button', { name: 'Following' })).toBeVisible()
  await member.goto('/feed')
  await expect(member.getByText('Members meeting')).toBeVisible()

  // The code is single-use.
  const latecomer = await newPage(browser)
  await signUp(latecomer, {
    name: 'Late Comer',
    email: 'late@e2e.test',
    password: 'late-password-1',
  })
  await latecomer.goto(`/join/${code}`)
  await expect(
    latecomer.getByText('This invite has already been used.', { exact: false }),
  ).toBeVisible()

  // Roster and invite history reflect the redemption.
  await president.goto('/manage/chess-society/members')
  await expect(president.getByText(MEMBER.name)).toBeVisible()
  await president.goto('/manage/chess-society/invites')
  await expect(president.getByRole('row', { name: new RegExp(code) })).toContainText('Used')

  // Only the admin can reach the admin console.
  await member.goto('/admin')
  await expect(member.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})
