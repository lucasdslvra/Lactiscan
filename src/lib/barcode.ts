/** Retail barcode symbologies MilkApp reads (expo-camera `BarcodeType` literals). */
export const SCAN_BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export type ScanBarcodeType = (typeof SCAN_BARCODE_TYPES)[number];

/** GTIN check digit (EAN-8, UPC-A, EAN-13) of the digits that precede it. */
export function gtinCheckDigit(body: string): number {
  let sum = 0;
  // Weights alternate 3, 1, 3… starting from the digit next to the check digit.
  for (let i = 0; i < body.length; i++) {
    const digit = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

/** Digits only, GTIN length (8, 12 or 13) and a matching check digit. */
export function isValidGtin(code: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13})$/.test(code)) return false;
  return gtinCheckDigit(code.slice(0, -1)) === Number(code.at(-1));
}

/** Expands the 6 data digits of a UPC-E code into the 10 middle digits of its UPC-A form. */
function expandUpcEDigits(d: string): string {
  const last = d[5];
  switch (last) {
    case '0':
    case '1':
    case '2':
      return `${d[0]}${d[1]}${last}0000${d[2]}${d[3]}${d[4]}`;
    case '3':
      return `${d[0]}${d[1]}${d[2]}00000${d[3]}${d[4]}`;
    case '4':
      return `${d[0]}${d[1]}${d[2]}${d[3]}00000${d[4]}`;
    default:
      return `${d[0]}${d[1]}${d[2]}${d[3]}${d[4]}0000${last}`;
  }
}

/** UPC-E (6, 7 or 8 digits) → 12-digit UPC-A, or `null` if it is not a UPC-E code. */
function upcEToUpcA(code: string): string | null {
  let numberSystem = '0';
  let data: string;
  if (code.length === 6) data = code;
  else if (code.length === 7 || code.length === 8) {
    numberSystem = code[0];
    data = code.slice(1, 7);
  } else return null;
  if (numberSystem !== '0' && numberSystem !== '1') return null;

  const body = `${numberSystem}${expandUpcEDigits(data)}`;
  const upcA = `${body}${gtinCheckDigit(body)}`;
  // When the scanner gave the check digit, it must match the expanded code.
  if (code.length === 8 && upcA.at(-1) !== code.at(-1)) return null;
  return upcA;
}

/**
 * Turns a scanned barcode into the code Open Food Facts stores: EAN-13 and EAN-8 as is,
 * UPC-A and UPC-E as their 13-digit EAN form (leading `0`). Returns `null` for anything that
 * is not a valid retail barcode, so a misread never opens a product sheet.
 */
export function normalizeScannedCode(type: string, data: string): string | null {
  const digits = data.trim();
  if (!/^\d+$/.test(digits)) return null;

  let code: string | null = digits;
  if (type === 'upc_e') code = upcEToUpcA(digits);
  if (code?.length === 12) code = `0${code}`;

  return code && isValidGtin(code) ? code : null;
}
