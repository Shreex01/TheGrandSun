import test from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluatePassword,
  getPasswordErrorMessage,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES,
} from './password.js'

test('accepts a strong password that meets every rule', () => {
  const result = evaluatePassword('Cloud!River9', { email: 'reader@example.com', name: 'Ava Stone' })
  assert.equal(result.valid, true)
  assert.equal(result.missing.length, 0)
  assert.equal(result.score, PASSWORD_RULES.length)
  assert.equal(result.tone, 'strong')
  assert.equal(getPasswordErrorMessage(result), '')
})

test('requires every character group', () => {
  const cases = [
    ['cloud!river9', 'uppercase'],
    ['CLOUD!RIVER9', 'lowercase'],
    ['Cloud!River', 'number'],
    ['CloudRiver9', 'symbol'],
  ]

  for (const [password, missingRule] of cases) {
    const result = evaluatePassword(password)
    assert.equal(result.valid, false, `${password} should not be valid`)
    assert.equal(result.checks[missingRule], false, `${password} should be missing ${missingRule}`)
  }
})

test('enforces a minimum length greater than eight characters', () => {
  assert.equal(PASSWORD_MIN_LENGTH, 9)
  assert.equal(evaluatePassword('Z9!tango').valid, false)
  assert.equal(evaluatePassword('Z9!tangofi').checks.length, true)
})

test('rejects common and leetspeak passwords', () => {
  for (const password of ['12345678', 'Password123!', 'P@ssw0rd!', 'Qwerty123!', 'Infinivium1!']) {
    const result = evaluatePassword(password)
    assert.equal(result.valid, false, `${password} should be rejected`)
    assert.equal(result.checks.common, false, `${password} should fail the common-password rule`)
  }
})

test('rejects dates, years, and phone-number-like passwords', () => {
  for (const password of [
    '12/03/1998Aa!',
    '1998-03-12Aa!',
    'Summer2026!A',
    '12/03/98Aa!',
    '120398Aa!',
    '030412Aa!',
    '9876543210Aa!',
    '9876543210',
  ]) {
    const result = evaluatePassword(password)
    assert.equal(result.valid, false, `${password} should be rejected`)
    assert.equal(result.checks.personal, false, `${password} should fail the personal-information rule`)
  }
})

test('does not treat an ordinary six-digit run as a date', () => {
  const result = evaluatePassword('Ab9!778899')
  assert.equal(result.checks.personal, true)
  assert.equal(result.valid, true)
})

test('rejects personal details supplied by the account form', () => {
  const nameResult = evaluatePassword('Sam!Cloud9', { name: 'Sam Rivera' })
  assert.equal(nameResult.checks.personal, false)

  const emailResult = evaluatePassword('River!Cloud9', { email: 'river@example.com' })
  assert.equal(emailResult.checks.personal, false)

  const dobResult = evaluatePassword('Rae!990506X', { dateOfBirth: '1990-05-06' })
  assert.equal(dobResult.checks.personal, false)

  const phoneResult = evaluatePassword('Rae!654X3210', { phone: '9876543210' })
  assert.equal(phoneResult.checks.personal, false)
})

test('rejects repeated characters and straight-line sequences', () => {
  const sequence = evaluatePassword('Abcdefg1!')
  assert.equal(sequence.checks.patterns, false)

  const repeated = evaluatePassword('Aaaaaaaaa1!')
  assert.equal(repeated.valid, false)
})

test('reports a friendly first issue for weak passwords', () => {
  const result = evaluatePassword('short')
  const message = getPasswordErrorMessage(result)
  assert.match(message, /stronger/i)
  assert.match(message, /at least 9 characters/i)
  assert.doesNotMatch(message, /regex|uppercase check failed|invalid input/i)
})
