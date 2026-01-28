// =========================================
// POCKET PAY - SHARED VALIDATION UTILITIES
// Input validation and sanitization for edge functions
// =========================================

// UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Maximum limits
export const MAX_AMOUNT = 1000000 // $1,000,000 max transaction
export const MIN_AMOUNT = 0.01 // $0.01 minimum
export const MAX_DESCRIPTION_LENGTH = 500
export const MAX_NOTE_LENGTH = 500
export const MAX_BANK_NAME_LENGTH = 100

// Valid enum values
export const VALID_TRANSACTION_TYPES = ['send', 'receive', 'deposit', 'withdrawal', 'request']
export const VALID_TRANSACTION_STATUSES = ['created', 'pending_confirmation', 'completed', 'blocked', 'failed']
export const VALID_WITHDRAWAL_SPEEDS = ['standard', 'instant']
export const VALID_CARD_TYPES = ['virtual', 'physical']

/**
 * Validate UUID format
 */
export function isValidUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return UUID_PATTERN.test(value)
}

/**
 * Validate and sanitize amount
 */
export function validateAmount(amount: unknown): { valid: boolean; value: number; error?: string } {
  const num = Number(amount)
  
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, value: 0, error: 'Invalid amount format' }
  }
  
  if (num < MIN_AMOUNT) {
    return { valid: false, value: 0, error: `Amount must be at least $${MIN_AMOUNT}` }
  }
  
  if (num > MAX_AMOUNT) {
    return { valid: false, value: 0, error: `Amount cannot exceed $${MAX_AMOUNT.toLocaleString()}` }
  }
  
  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100
  return { valid: true, value: rounded }
}

/**
 * Sanitize text input - remove potential XSS and limit length
 */
export function sanitizeText(text: unknown, maxLength: number): string {
  if (typeof text !== 'string') return ''
  
  return text
    .replace(/[<>]/g, '') // Remove HTML angle brackets
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, maxLength)
}

/**
 * Validate description field
 */
export function validateDescription(description: unknown): { valid: boolean; value: string; error?: string } {
  if (typeof description !== 'string' || description.trim().length === 0) {
    return { valid: false, value: '', error: 'Description is required' }
  }
  
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { valid: false, value: '', error: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters` }
  }
  
  const sanitized = sanitizeText(description, MAX_DESCRIPTION_LENGTH)
  if (sanitized.length === 0) {
    return { valid: false, value: '', error: 'Description is required' }
  }
  
  return { valid: true, value: sanitized }
}

/**
 * Validate optional note field
 */
export function validateNote(note: unknown): { valid: boolean; value: string | null; error?: string } {
  if (note === undefined || note === null || note === '') {
    return { valid: true, value: null }
  }
  
  if (typeof note !== 'string') {
    return { valid: false, value: null, error: 'Note must be a string' }
  }
  
  if (note.length > MAX_NOTE_LENGTH) {
    return { valid: false, value: null, error: `Note cannot exceed ${MAX_NOTE_LENGTH} characters` }
  }
  
  const sanitized = sanitizeText(note, MAX_NOTE_LENGTH)
  return { valid: true, value: sanitized || null }
}

/**
 * Validate optional bank name field
 */
export function validateBankName(bankName: unknown): { valid: boolean; value: string | null; error?: string } {
  if (bankName === undefined || bankName === null || bankName === '') {
    return { valid: true, value: null }
  }
  
  if (typeof bankName !== 'string') {
    return { valid: false, value: null, error: 'Bank name must be a string' }
  }
  
  if (bankName.length > MAX_BANK_NAME_LENGTH) {
    return { valid: false, value: null, error: `Bank name cannot exceed ${MAX_BANK_NAME_LENGTH} characters` }
  }
  
  const sanitized = sanitizeText(bankName, MAX_BANK_NAME_LENGTH)
  return { valid: true, value: sanitized || null }
}

/**
 * Validate enum value against allowed values
 */
export function validateEnum<T extends string>(value: unknown, allowedValues: T[], fieldName: string): { valid: boolean; value: T | null; error?: string } {
  if (value === undefined || value === null || value === '') {
    return { valid: true, value: null }
  }
  
  if (typeof value !== 'string') {
    return { valid: false, value: null, error: `${fieldName} must be a string` }
  }
  
  if (!allowedValues.includes(value as T)) {
    return { valid: false, value: null, error: `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}` }
  }
  
  return { valid: true, value: value as T }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(limit: unknown, offset: unknown): { limit: number; offset: number } {
  const parsedLimit = Math.min(Math.max(1, parseInt(String(limit)) || 50), 100) // 1-100, default 50
  const parsedOffset = Math.max(0, parseInt(String(offset)) || 0) // 0+, default 0
  
  return { limit: parsedLimit, offset: parsedOffset }
}

/**
 * Create validation error response
 */
export function validationError(error: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
