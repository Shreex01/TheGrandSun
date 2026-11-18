export function isValidUsername(value) {
  return /^[a-z0-9_]{3,24}$/.test(value)
}
