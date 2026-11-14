export const PASSWORD_MIN_LENGTH = 9

export const PASSWORD_RULES = [
  { key: 'length', label: `At least ${PASSWORD_MIN_LENGTH} characters`, issue: `make it at least ${PASSWORD_MIN_LENGTH} characters long` },
  { key: 'lowercase', label: 'One lowercase letter', issue: 'add a lowercase letter' },
  { key: 'uppercase', label: 'One uppercase letter', issue: 'add an uppercase letter' },
  { key: 'number', label: 'One number', issue: 'add a number' },
  { key: 'symbol', label: 'One symbol (like ! or #)', issue: 'add a symbol such as ! or #' },
  { key: 'common', label: 'Not a commonly used password', issue: 'choose something less common — this one is easy to guess' },
  { key: 'personal', label: 'No dates, phone numbers, or personal details', issue: 'leave out dates, phone numbers, or personal details like your name or email' },
  { key: 'patterns', label: 'No repeated or straight-line patterns', issue: 'avoid repeated characters or long sequences such as 123456 or abcdef' },
]

const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  '87654321',
  '11111111',
  '00000000',
  'password',
  'password1',
  'password123',
  'passw0rd',
  'p@ssword',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'abc123',
  'abc12345',
  'abcdef',
  'abcdefgh',
  'letmein',
  'welcome',
  'welcome1',
  'admin',
  'administrator',
  'iloveyou',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'sunshine',
  'princess',
  'starwars',
  'whatever',
  'trustno1',
  'master',
  'login',
  'user',
  'guest',
  'infinivium',
  'grandsun',
])

const LEET_MAP = {
  0: 'o',
  1: 'l',
  3: 'e',
  4: 'a',
  5: 's',
  7: 't',
  '@': 'a',
  $: 's',
}

const asText = (value) => String(value ?? '')

const compact = (value) => asText(value).toLowerCase().replace(/\s+/g, '')

const alphanumeric = (value) => compact(value).replace(/[^a-z0-9]/g, '')

const lettersOnly = (value) => compact(value).replace(/[^a-z]/g, '')

const leetLetters = (value) => compact(value)
  .replace(/[013457@$]/g, (character) => LEET_MAP[character] ?? character)
  .replace(/[^a-z]/g, '')

const hasStraightRun = (value, minimum = 6) => {
  const lower = asText(value).toLowerCase()
  let ascending = 1
  let descending = 1

  for (let index = 1; index < lower.length; index += 1) {
    const difference = lower.charCodeAt(index) - lower.charCodeAt(index - 1)
    ascending = difference === 1 ? ascending + 1 : 1
    descending = difference === -1 ? descending + 1 : 1
    if (ascending >= minimum || descending >= minimum) return true
  }

  return false
}

const hasDateShape = (value) => {
  const text = asText(value)
  const dayMonthLongYear = /(?:0?[1-9]|[12]\d|3[01])[./\-_ ](?:0?[1-9]|1[0-2])[./\-_ ](?:19|20)\d{2}/
  const yearMonthDay = /(?:19|20)\d{2}[./\-_ ](?:0?[1-9]|1[0-2])[./\-_ ](?:0?[1-9]|[12]\d|3[01])/
  const dayMonthShortYear = /(?:0?[1-9]|[12]\d|3[01])[./\-_ ](?:0?[1-9]|1[0-2])[./\-_ ]\d{2}(?!\d)/
  const shortYearMonthDay = /\d{2}[./\-_ ](?:0?[1-9]|1[0-2])[./\-_ ](?:0?[1-9]|[12]\d|3[01])/
  const compactDayMonthYear = /(?:^|\D)(?:0?[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])\d{2}(?!\d)/
  const compactMonthDayYear = /(?:^|\D)(?:0?[1-9]|1[0-2])(?:0?[1-9]|[12]\d|3[01])\d{2}(?!\d)/
  return dayMonthLongYear.test(text)
    || yearMonthDay.test(text)
    || dayMonthShortYear.test(text)
    || shortYearMonthDay.test(text)
    || compactDayMonthYear.test(text)
    || compactMonthDayYear.test(text)
}

const isCommonPassword = (value) => {
  const direct = compact(value)
  if (!direct) return false
  const plainLetters = lettersOnly(value)
  const leet = leetLetters(value)
  return COMMON_PASSWORDS.has(direct)
    || (plainLetters.length > 0 && COMMON_PASSWORDS.has(plainLetters))
    || (leet.length > 0 && COMMON_PASSWORDS.has(leet))
}

const personalTokens = (context) => {
  const tokens = new Set()
  const add = (value) => {
    const token = alphanumeric(value)
    if (token.length >= 3) tokens.add(token)
  }

  if (context.email) {
    const email = asText(context.email)
    add(email.split('@')[0])
    add(email)
  }
  if (context.name) {
    asText(context.name).split(/\s+/).forEach(add)
  }
  if (context.fullName) {
    asText(context.fullName).split(/\s+/).forEach(add)
  }
  return tokens
}

const containsPersonalInfo = (value, context = {}) => {
  const password = compact(value)
  const passwordAlphanumeric = alphanumeric(value)
  const digits = asText(value).replace(/\D/g, '')

  if (/\d{8,}/.test(password)) return true
  if (/(?:19|20)\d{2}/.test(password)) return true
  if (hasDateShape(password)) return true

  for (const token of personalTokens(context)) {
    if (token.length >= 3 && passwordAlphanumeric.includes(token)) return true
  }

  const phone = asText(context.phone ?? context.phoneNumber).replace(/\D/g, '')
  if (phone.length >= 6) {
    if (digits.includes(phone)) return true
    if (phone.length >= 7 && digits.includes(phone.slice(-7))) return true
  }

  const dateOfBirth = asText(context.dateOfBirth).replace(/\D/g, '')
  if (dateOfBirth.length >= 4) {
    if (digits.includes(dateOfBirth)) return true
    if (dateOfBirth.length === 8 && (digits.includes(dateOfBirth.slice(4)) || digits.includes(dateOfBirth.slice(0, 4)))) return true
  }

  return false
}

const hasRepeatedRun = (value, maximum = 4) => {
  const lower = asText(value).toLowerCase()
  let run = 1

  for (let index = 1; index < lower.length; index += 1) {
    run = lower[index] === lower[index - 1] ? run + 1 : 1
    if (run >= maximum) return true
  }

  return false
}

const hasSimplePattern = (value) => {
  const password = asText(value)
  if (!password) return false
  if (hasRepeatedRun(password, 4)) return true
  return hasStraightRun(password, 6)
}

export function evaluatePassword(password, context = {}) {
  const value = asText(password)
  const checks = {
    length: value.length >= PASSWORD_MIN_LENGTH,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
    common: value.length > 0 && !isCommonPassword(value),
    personal: value.length > 0 && !containsPersonalInfo(value, context),
    patterns: !hasSimplePattern(value),
  }

  const missing = PASSWORD_RULES.filter((rule) => !checks[rule.key])
  const valid = value.length > 0 && missing.length === 0
  const satisfied = PASSWORD_RULES.length - missing.length
  const percent = Math.round((satisfied / PASSWORD_RULES.length) * 100)

  let tone = 'weak'
  if (valid) tone = 'strong'
  else if (satisfied >= 7) tone = 'good'
  else if (satisfied >= 5) tone = 'fair'

  const label = valid
    ? 'Strong password'
    : satisfied >= 7
      ? 'Almost there'
      : satisfied >= 5
        ? 'Getting stronger'
        : satisfied >= 3
          ? 'Still a little weak'
          : 'Too weak'

  return {
    valid,
    checks,
    missing,
    score: satisfied,
    total: PASSWORD_RULES.length,
    percent,
    tone,
    label,
  }
}

export function getPasswordErrorMessage(result) {
  if (!result || result.valid) return ''
  const firstIssue = result.missing[0]?.issue ?? 'choose a stronger password'
  const more = result.missing.length > 1 ? ' The checklist below will help with the rest.' : ''
  return `Let’s make that password a little stronger — ${firstIssue}.${more}`
}
