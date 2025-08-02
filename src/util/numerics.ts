const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER; // 9,007,199,254,740,991
const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER; // -9,007,199,254,740,991

export type NumericValue = number | bigint;

export const isBigInt = (value: any): value is bigint => typeof value === 'bigint';
export function parseNumeric(value: string): NumericValue {
  if (!value || typeof value !== 'string') {
    return 0;
  }

  const trimmed = value.trim();
  
  if (!trimmed) {
    return 0;
  }

  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return 0;
  }

  // If it has decimal places, convert to number (bigint doesn't support decimals :c)
  if (trimmed.includes('.')) {
    const num = parseFloat(trimmed);
    return isNaN(num) ? 0 : num;
  }

  try {
    const num = parseInt(trimmed, 10);
    
    if (num >= MIN_SAFE_INTEGER && num <= MAX_SAFE_INTEGER) {
      return num;
    }
    
    return BigInt(trimmed);
  } catch (error) {
    return 0;
  }
}


export function numericToString(value: NumericValue): string {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  
  if (Number.isInteger(value)) {
    return value.toString();
  } else {
    return value.toFixed(2).replace(/\.?0+$/, '');
  }
}

/**
 * Adds two numeric values, automatically handling number/bigint conversion
 */
export function addNumeric(a: string | NumericValue, b: string | NumericValue): NumericValue {
  const numA = typeof a === 'string' ? parseNumeric(a) : a;
  const numB = typeof b === 'string' ? parseNumeric(b) : b;
  
  if (typeof numA === 'bigint' || typeof numB === 'bigint') {
    const bigA = typeof numA === 'bigint' ? numA : BigInt(Math.floor(numA));
    const bigB = typeof numB === 'bigint' ? numB : BigInt(Math.floor(numB));
    return bigA + bigB;
  }
  
  return numA + numB;
}

/**
 * Subtracts two numeric values, automatically handling number/bigint conversion
 */
export function subtractNumeric(a: string | NumericValue, b: string | NumericValue): NumericValue {
  const numA = typeof a === 'string' ? parseNumeric(a) : a;
  const numB = typeof b === 'string' ? parseNumeric(b) : b;
  
  if (typeof numA === 'bigint' || typeof numB === 'bigint') {
    const bigA = typeof numA === 'bigint' ? numA : BigInt(Math.floor(numA));
    const bigB = typeof numB === 'bigint' ? numB : BigInt(Math.floor(numB));
    return bigA - bigB;
  }
  
  return numA - numB;
}

/**
 * Multiplies two numeric values, automatically handling number/bigint conversion
 */
export function multiplyNumeric(a: string | NumericValue, b: string | NumericValue): NumericValue {
  const numA = typeof a === 'string' ? parseNumeric(a) : a;
  const numB = typeof b === 'string' ? parseNumeric(b) : b;
  
  if (typeof numA === 'bigint' || typeof numB === 'bigint') {
    const bigA = typeof numA === 'bigint' ? numA : BigInt(Math.floor(numA));
    const bigB = typeof numB === 'bigint' ? numB : BigInt(Math.floor(numB));
    return bigA * bigB;
  }
  
  const result = numA * numB;
  if (result > MAX_SAFE_INTEGER || result < MIN_SAFE_INTEGER) {
    return BigInt(Math.floor(numA)) * BigInt(Math.floor(numB));
  }
  
  return result;
}

/**
 * Divides two numeric values, automatically handling number/bigint conversion
 * Always returns a number for division to handle decimals
 */
export function divideNumeric(a: string | NumericValue, b: string | NumericValue): number {
  const numA = typeof a === 'string' ? parseNumeric(a) : a;
  const numB = typeof b === 'string' ? parseNumeric(b) : b;
  
  if (numB === 0 || numB === 0n) {
    return 0; // Avoid division by zero
  }
  
  // Convert both to numbers for division
  const floatA = typeof numA === 'bigint' ? Number(numA) : numA;
  const floatB = typeof numB === 'bigint' ? Number(numB) : numB;
  
  return floatA / floatB;
}

/**
 * Compares two numeric values
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareNumeric(a: string | NumericValue, b: string | NumericValue): -1 | 0 | 1 {
  const numA = typeof a === 'string' ? parseNumeric(a) : a;
  const numB = typeof b === 'string' ? parseNumeric(b) : b;
  
  // If types are the same, direct comparison
  if (typeof numA === typeof numB) {
    if (numA < numB) return -1;
    if (numA > numB) return 1;
    return 0;
  }
  
  // If types differ, convert to bigint for comparison
  const bigA = typeof numA === 'bigint' ? numA : BigInt(Math.floor(numA));
  const bigB = typeof numB === 'bigint' ? numB : BigInt(Math.floor(numB));
  
  if (bigA < bigB) return -1;
  if (bigA > bigB) return 1;
  return 0;
}

/**
 * Checks if a numeric value is greater than another
 */
export function isGreaterThan(a: string | NumericValue, b: string | NumericValue): boolean {
  return compareNumeric(a, b) === 1;
}

/**
 * Checks if a numeric value is less than another
 */
export function isLessThan(a: string | NumericValue, b: string | NumericValue): boolean {
  return compareNumeric(a, b) === -1;
}

/**
 * Checks if a numeric value is greater than or equal to another
 */
export function isGreaterThanOrEqual(a: string | NumericValue, b: string | NumericValue): boolean {
  const result = compareNumeric(a, b);
  return result === 1 || result === 0;
}

/**
 * Checks if a numeric value is less than or equal to another
 */
export function isLessThanOrEqual(a: string | NumericValue, b: string | NumericValue): boolean {
  const result = compareNumeric(a, b);
  return result === -1 || result === 0;
}

/**
 * Checks if two numeric values are equal
 */
export function isEqual(a: string | NumericValue, b: string | NumericValue): boolean {
  return compareNumeric(a, b) === 0;
}

/**
 * Returns the maximum of two numeric values
 */
export function maxNumeric(a: string | NumericValue, b: string | NumericValue): NumericValue {
  return isGreaterThan(a, b) ? (typeof a === 'string' ? parseNumeric(a) : a) : (typeof b === 'string' ? parseNumeric(b) : b);
}

/**
 * Returns the minimum of two numeric values
 */
export function minNumeric(a: string | NumericValue, b: string | NumericValue): NumericValue {
  return isLessThan(a, b) ? (typeof a === 'string' ? parseNumeric(a) : a) : (typeof b === 'string' ? parseNumeric(b) : b);
}

/**
 * Formats a numeric value for display with appropriate suffixes
 * like cookie clicker :3
 */
export function formatNumeric(value: string | NumericValue, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseNumeric(value) : value;
  const absNum = typeof num === 'bigint' ? (num < 0n ? -num : num) : Math.abs(num);
  
  // Convert to number for formatting (losing some precision for very large bigints)
  const numValue = typeof absNum === 'bigint' ? Number(absNum) : absNum;
  const isNegative = (typeof num === 'bigint' ? num < 0n : num < 0);
  
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Infinity'];
  let suffixIndex = 0;
  let displayValue = numValue;
  
  while (displayValue >= 1000 && suffixIndex < suffixes.length - 1) {
    displayValue /= 1000;
    suffixIndex++;
  }
  
  const formatted = displayValue.toFixed(decimals).replace(/\.?0+$/, '');
  return (isNegative ? '-' : '') + formatted + suffixes[suffixIndex];
}


export function safeToString(value: any): string {
  if (value === null || value === undefined) return '0';
  if (typeof value === 'string') return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number') return numericToString(value);
  return '0';
}