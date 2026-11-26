import test from 'node:test'
import assert from 'node:assert/strict'
import { friendlyError, friendlyMessage } from './messages.js'

const TECHNICAL_WORDS = [
  'relation',
  'table',
  'database',
  'supabase',
  'vite',
  'postgres',
  'sql',
  'rls',
  'jwt',
  'env',
  'schema',
  'stack',
  'http',
  'undefined',
  'null',
]

const assertFriendly = (text, label) => {
  const lower = text.toLowerCase()
  for (const word of TECHNICAL_WORDS) {
    assert.equal(
      lower.includes(word),
      false,
      `${label} should not mention "${word}" — received: ${text}`,
    )
  }
}

test('turns missing-table errors into customer-friendly copy', () => {
  const error = new Error('relation "public.products" does not exist')
  for (const context of ['catalog', 'library', 'lessons', 'ebook', 'payment', 'admin']) {
    const result = friendlyError(error, context)
    assert.ok(result.title.length > 0, `${context} should have a title`)
    assert.ok(result.message.length > 0, `${context} should have a message`)
    assertFriendly(result.title, `${context} title`)
    assertFriendly(result.message, `${context} message`)
    assert.match(result.message, /try again|moment|little while|minutes/i)
  }
})

test('turns network failures into friendly, reassuring messages', () => {
  const errors = [
    new TypeError('Failed to fetch'),
    new Error('NetworkError when attempting to fetch resource.'),
    new Error('fetch failed'),
    new Error('The operation timed out'),
  ]

  for (const error of errors) {
    for (const context of ['catalog', 'payment', 'signIn', 'signUp', 'account']) {
      const message = friendlyMessage(error, context)
      assertFriendly(message, `${context} network message`)
      assert.match(message, /connection|internet/i)
    }
  }
})

test('never exposes authentication implementation details', () => {
  const result = friendlyError(new Error('Invalid login credentials'), 'signIn')
  assert.equal(result.message, 'Those details didn’t match. Please check your email and password, then try again.')
  assertFriendly(result.title, 'sign-in title')
  assertFriendly(result.message, 'sign-in message')

  const signup = friendlyError(new Error('User already registered'), 'signUp')
  assert.match(signup.message, /already have an account/i)
  assertFriendly(signup.message, 'sign-up message')
})

test('explains password requirements without technical language', () => {
  const result = friendlyError(new Error('Password should be at least 6 characters'), 'signUp')
  assert.match(result.message, /nine characters/i)
  assert.match(result.message, /uppercase/i)
  assert.match(result.message, /symbol/i)

  const update = friendlyMessage(new Error('weak password'), 'updatePassword')
  assert.match(update, /nine characters/i)
})

test('guides users to request a fresh link when password recovery expires', () => {
  const recoveryError = new Error('Email link is invalid or has expired')
  assert.match(friendlyMessage(recoveryError, 'reset'), /request a fresh link/i)
  assert.match(friendlyMessage(new Error('Auth session missing'), 'updatePassword'), /request a fresh link/i)
})

test('payment problems reassure the customer that nothing was charged', () => {
  const declined = friendlyError(new Error('card declined'), 'payment')
  assert.match(declined.message, /nothing has been charged/i)
  assertFriendly(declined.message, 'payment message')

  const missingOrder = friendlyError(new Error('no rows returned'), 'order')
  assert.match(missingOrder.message, /contact us/i)
  assertFriendly(missingOrder.message, 'order message')
})

test('permission errors ask the customer to sign in again', () => {
  for (const context of ['library', 'lessons', 'ebook', 'account', 'admin']) {
    const message = friendlyMessage(new Error('permission denied for table purchases'), context)
    assert.match(message, /sign in|studio team/i, `${context} should guide the customer`)
    assertFriendly(message, `${context} permission message`)
  }
})

test('rate limiting asks for patience instead of exposing limits', () => {
  const message = friendlyMessage(new Error('email rate limit exceeded'), 'reset')
  assert.match(message, /pause|wait|short|moment|try again/i)
  assertFriendly(message, 'rate-limit message')
})

test('falls back gracefully for unknown errors and empty values', () => {
  const unknown = friendlyError(new Error('xkcd-9281 unexpected'), 'generic')
  assert.ok(unknown.message.length > 0)
  assertFriendly(unknown.message, 'generic fallback')

  const empty = friendlyError(null, 'catalog')
  assert.ok(empty.message.length > 0)
  assert.equal(empty.technical, '')
  assertFriendly(empty.message, 'empty fallback')

  const missingContext = friendlyMessage(new Error('failed to fetch'), 'not-a-context')
  assert.ok(missingContext.length > 0)
  assertFriendly(missingContext, 'unknown context')
})

test('keeps the technical detail out of the customer-facing copy', () => {
  const result = friendlyError(new Error('relation "public.enrollments" does not exist'), 'library')
  assert.match(result.technical, /relation/i)
  assertFriendly(result.title, 'title')
  assertFriendly(result.message, 'message')
})
