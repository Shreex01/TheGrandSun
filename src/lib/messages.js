const COMMON = {
  network: 'It looks like your connection slipped. Check your internet and try again — nothing you’ve done has been lost.',
  notReady: 'We’re finishing a little work behind the scenes. Please try again in a few minutes.',
  permission: 'That area is private. Please sign in again so we can make sure it’s you.',
  invalidCredentials: 'Those details didn’t match. Please check your email and password, then try again.',
  emailNotConfirmed: 'Your email still needs confirming. Look for our link in your inbox, then come back and sign in.',
  alreadyRegistered: 'It looks like you already have an account with this email. Try signing in instead.',
  weakPassword: 'That password needs a little more strength. Please choose a longer one with a mix of letters, numbers, and symbols.',
  rateLimit: 'You’ve tried a few times in a row. Take a short pause, then we’ll be ready for another go.',
  duplicate: 'That already exists, so we didn’t create a second copy.',
  notFound: 'We couldn’t find that just now. It may have moved — please refresh and try again.',
  paymentDeclined: 'That payment didn’t go through. Nothing has been charged — you can try again whenever you’re ready.',
  fallback: 'Something didn’t go to plan. Please try again in a moment.',
}

const CONTEXTS = {
  generic: {
    title: 'Something didn’t go to plan',
    fallback: 'Something didn’t go to plan. Please try again in a moment.',
  },
  catalog: {
    title: 'Our collection needs a moment',
    fallback: 'We couldn’t refresh the shelves just now. Your place is saved — please try again in a little while.',
    notReady: 'We’re restocking the shelves behind the scenes. Please refresh in a little while and everything will be waiting for you.',
    network: 'It looks like your connection slipped while we fetched the collection. Check your internet and try again.',
  },
  library: {
    title: 'Your library is taking a moment',
    fallback: 'We couldn’t open your library just now. Your books and courses are safe — please try again in a little while.',
    notReady: 'We’re just reconnecting the shelves in your library. Everything you’ve bought is safe — please try again in a few minutes.',
    permission: 'For your privacy, your library needs a fresh sign-in. Please sign in again to continue.',
    network: 'It looks like your connection slipped while we opened your library. Check your internet and try again.',
  },
  lessons: {
    title: 'Your lessons are on their way',
    fallback: 'We couldn’t open your course materials just now. Nothing has been lost — please try again in a little while.',
    notReady: 'We’re reconnecting your course materials. Nothing has been lost — please try again shortly.',
    permission: 'Your lessons are private to your account. Please sign in again to keep learning.',
    network: 'It looks like your connection slipped while we fetched your lessons. Check your internet and try again.',
  },
  ebook: {
    title: 'Your reader needs a moment',
    fallback: 'We couldn’t open your e-book just now. Your purchase is safe — please try again in a little while.',
    notReady: 'We’re reconnecting your reader. Your book is safe — please try again in a few minutes.',
    permission: 'Your reader is private to your account. Please sign in again to continue reading.',
    network: 'It looks like your connection slipped while we opened your e-book. Check your internet and try again.',
  },
  payment: {
    title: 'Let’s sort your payment out',
    fallback: 'We couldn’t complete that step just now. Nothing has been charged — please try again in a moment.',
    notReady: 'Secure payments are taking a short pause. Nothing has been charged — please try again in a little while.',
    permission: 'Please sign in again so we can safely check your payment.',
    network: 'It looks like your connection slipped during checkout. Nothing has been charged — check your internet and try again.',
    paymentDeclined: 'That payment didn’t go through. Nothing has been charged — you can try again whenever you’re ready.',
  },
  order: {
    title: 'We’re checking on your order',
    fallback: 'We couldn’t check your order just now. If money has left your account, don’t worry — contact us and we’ll help you sort it out.',
    notFound: 'We couldn’t find that order on your account. If you think a payment was taken, please contact us and we’ll look into it right away.',
    network: 'It looks like your connection slipped while we checked your order. Check your internet and try again.',
  },
  signIn: {
    title: 'That didn’t quite match',
    fallback: 'We couldn’t sign you in just now. Please check your details and try again.',
    permission: 'Please sign in again to continue.',
    network: 'It looks like your connection slipped. Check your internet and try again.',
  },
  signUp: {
    title: 'We couldn’t create your account just now',
    fallback: 'We couldn’t create your account just now. Please try again in a moment.',
    alreadyRegistered: 'It looks like you already have an account with this email. Try signing in instead.',
    weakPassword: 'That password needs a little more strength. Use at least nine characters with uppercase, lowercase, a number, and a symbol.',
    notReady: 'Account creation is taking a short pause. Please try again in a little while — we’d love to have you here.',
    network: 'It looks like your connection slipped while we created your account. Check your internet and try again.',
  },
  reset: {
    title: 'We couldn’t send the link',
    fallback: 'We couldn’t send that reset link just now. Please try again in a moment.',
    network: 'It looks like your connection slipped while we sent the link. Check your internet and try again.',
    recoveryLinkExpired: 'That password reset link has expired or already been used. Please request a fresh link.',
  },
  updatePassword: {
    title: 'Your password wasn’t updated',
    fallback: 'We couldn’t update your password just now. Please try again in a moment.',
    weakPassword: 'That password needs a little more strength. Use at least nine characters with uppercase, lowercase, a number, and a symbol.',
    permission: 'That password reset link has expired or already been used. Please request a fresh link.',
    recoveryLinkExpired: 'That password reset link has expired or already been used. Please request a fresh link.',
    network: 'It looks like your connection slipped while we updated your password. Check your internet and try again.',
  },
  account: {
    title: 'A small hiccup',
    fallback: 'Something didn’t load quite right. Your account is safe — please try again in a moment.',
    permission: 'Please sign in again so we can make sure it’s you.',
    network: 'It looks like your connection slipped. Check your internet and try again — your account is safe.',
  },
  admin: {
    title: 'That didn’t save',
    fallback: 'We couldn’t complete that just now. Please try again in a moment.',
    notReady: 'The studio is briefly offline while we reconnect a few things. Please try again in a few minutes.',
    permission: 'This area is just for the studio team. Please sign in with an administrator account.',
    duplicate: 'A product with that ID already exists. Choose a slightly different ID and try again.',
    network: 'It looks like your connection slipped while saving. Check your internet and try again.',
  },
}

const PATTERNS = [
  { key: 'invalidCredentials', test: /invalid login credentials|invalid credentials|invalid email or password|email or password is incorrect|incorrect password|user not found/i },
  { key: 'emailNotConfirmed', test: /email not confirmed|email.*not.*verified|confirm your email|email verification/i },
  { key: 'alreadyRegistered', test: /already registered|user already exists|already been registered|email.*already.*(?:registered|exists)/i },
  { key: 'weakPassword', test: /password should be|weak password|password.*(?:at least|characters|too short)|password.*strength/i },
  { key: 'recoveryLinkExpired', test: /email link is invalid or has expired|otp expired|token has expired|invalid recovery token/i },
  { key: 'rateLimit', test: /rate limit|too many requests|for security purposes|email rate limit|\b429\b|over email limit/i },
  { key: 'paymentDeclined', test: /payment failed|card declined|payment.*declined|payment.*unsuccessful|payment was cancelled|payment cancelled/i },
  { key: 'permission', test: /auth session missing|permission denied|row-level security|rls policy|not authorized|unauthorized|invalid jwt|jwt expired|jwt|access denied|insufficient privilege|\b401\b|\b403\b/i },
  { key: 'notReady', test: /relation .* does not exist|could not find the table|table .* does not exist|schema cache|undefined table|column .* does not exist|not found in the schema|pgrst205/i },
  { key: 'network', test: /failed to fetch|networkerror|network error|fetch failed|load failed|offline|econn|enotfound|etimedout|timed out|network request failed/i },
  { key: 'duplicate', test: /duplicate key|already exists|unique constraint|23505/i },
  { key: 'notFound', test: /not found|no rows|0 rows|pgrst116|does not exist/i },
]

const extractMessage = (error) => {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return String(error.message ?? error.error_description ?? error.error ?? error.msg ?? error.hint ?? '')
}

export function friendlyError(error, context = 'generic') {
  const technical = extractMessage(error)
  const settings = CONTEXTS[context] ?? CONTEXTS.generic
  const respond = (key) => ({
    title: settings.title,
    message: settings[key] ?? COMMON[key] ?? settings.fallback ?? COMMON.fallback,
    technical,
  })

  if (!technical) {
    return { title: settings.title, message: settings.fallback ?? COMMON.fallback, technical: '' }
  }

  const match = PATTERNS.find((pattern) => pattern.test.test(technical))
  if (match) return respond(match.key)

  return {
    title: settings.title,
    message: settings.fallback ?? COMMON.fallback,
    technical,
  }
}

export function friendlyMessage(error, context = 'generic') {
  return friendlyError(error, context).message
}
