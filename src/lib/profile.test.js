import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidUsername } from './profile.js'

test('accepts usernames with lowercase letters, numbers, and underscores', () => {
  assert.equal(isValidUsername('curious_reader7'), true)
})

test('rejects usernames outside the supported format and length', () => {
  assert.equal(isValidUsername('Abc'), false)
  assert.equal(isValidUsername('two words'), false)
  assert.equal(isValidUsername('ab'), false)
  assert.equal(isValidUsername('a'.repeat(25)), false)
})
