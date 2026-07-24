const DANGEROUS_SPREADSHEET_PREFIX = /^[=+\-@\t\r]/

export function spreadsheetSafeString(value: string): string {
  return DANGEROUS_SPREADSHEET_PREFIX.test(value) ? `'${value}` : value
}

export function spreadsheetSafeCell<T>(value: T): T | string {
  return typeof value === 'string' ? spreadsheetSafeString(value) : value
}
