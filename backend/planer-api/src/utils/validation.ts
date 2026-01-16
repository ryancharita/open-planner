/**
 * Validation utilities for API endpoints
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): ValidationResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuid || !uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' }
  }
  return { valid: true }
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function validateDate(dateString: string): ValidationResult {
  if (!dateString || typeof dateString !== 'string') {
    return { valid: false, error: 'Date is required and must be a string' }
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' }
  }

  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' }
  }

  // Check if date string matches parsed date (catches invalid dates like 2024-13-45)
  const [year, month, day] = dateString.split('-').map(Number)
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return { valid: false, error: 'Invalid date values' }
  }

  return { valid: true }
}

/**
 * Validate amount (must be positive number)
 */
export function validateAmount(amount: number): ValidationResult {
  if (amount === undefined || amount === null) {
    return { valid: false, error: 'Amount is required' }
  }

  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' }
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' }
  }

  if (amount > 999999999999.99) {
    return { valid: false, error: 'Amount exceeds maximum value' }
  }

  return { valid: true }
}

/**
 * Validate interest rate (0 to 1, representing 0% to 100%)
 */
export function validateInterestRate(rate: number): ValidationResult {
  if (rate === undefined || rate === null) {
    return { valid: false, error: 'Interest rate is required' }
  }

  if (typeof rate !== 'number' || isNaN(rate)) {
    return { valid: false, error: 'Interest rate must be a valid number' }
  }

  if (rate < 0 || rate > 1) {
    return { valid: false, error: 'Interest rate must be between 0 and 1 (0% to 100%)' }
  }

  return { valid: true }
}

/**
 * Validate term in months
 */
export function validateTermMonths(term: number): ValidationResult {
  if (term === undefined || term === null) {
    return { valid: false, error: 'Term is required' }
  }

  if (typeof term !== 'number' || isNaN(term)) {
    return { valid: false, error: 'Term must be a valid number' }
  }

  if (term <= 0 || !Number.isInteger(term)) {
    return { valid: false, error: 'Term must be a positive integer (months)' }
  }

  if (term > 600) {
    return { valid: false, error: 'Term cannot exceed 600 months (50 years)' }
  }

  return { valid: true }
}

/**
 * Validate day of month (1-31)
 */
export function validateDayOfMonth(day: number): ValidationResult {
  if (day === undefined || day === null) {
    return { valid: false, error: 'Day of month is required' }
  }

  if (typeof day !== 'number' || isNaN(day)) {
    return { valid: false, error: 'Day of month must be a valid number' }
  }

  if (day < 1 || day > 31 || !Number.isInteger(day)) {
    return { valid: false, error: 'Day of month must be between 1 and 31' }
  }

  return { valid: true }
}

/**
 * Validate backdated entry (allow past dates but warn if too far back)
 * Returns warning but still allows it
 */
export function validateBackdatedEntry(dateString: string, maxYearsBack: number = 10): ValidationResult {
  const dateValidation = validateDate(dateString)
  if (!dateValidation.valid) {
    return dateValidation
  }

  const entryDate = new Date(dateString)
  const now = new Date()
  const yearsDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  if (yearsDiff > maxYearsBack) {
    return {
      valid: true, // Still valid, but return warning
      error: `Entry date is more than ${maxYearsBack} years in the past. This may affect historical calculations.`,
    }
  }

  return { valid: true }
}

/**
 * Validate future date (for loans, recurring items)
 */
export function validateFutureDate(dateString: string, allowFuture: boolean = true): ValidationResult {
  const dateValidation = validateDate(dateString)
  if (!dateValidation.valid) {
    return dateValidation
  }

  const entryDate = new Date(dateString)
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Reset time to compare dates only

  if (!allowFuture && entryDate > now) {
    return { valid: false, error: 'Date cannot be in the future' }
  }

  return { valid: true }
}

/**
 * Validate description length
 */
export function validateDescription(description: string | null | undefined, maxLength: number = 500): ValidationResult {
  if (description === null || description === undefined) {
    return { valid: true } // Optional field
  }

  if (typeof description !== 'string') {
    return { valid: false, error: 'Description must be a string' }
  }

  if (description.length > maxLength) {
    return { valid: false, error: `Description cannot exceed ${maxLength} characters` }
  }

  return { valid: true }
}
