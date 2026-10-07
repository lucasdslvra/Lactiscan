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

  const code = type === 'upc_e' ? upcEToUpcA(digits) : digits;
  return code && normalizeGtin(code);
}

/** Valid GTIN → the form Open Food Facts stores (UPC-A gets a leading `0`), else `null`. */
export function normalizeGtin(code: string): string | null {
  if (!isValidGtin(code)) return null;
  return code.length === 12 ? `0${code}` : code;
}

export type GtinFormat = 'EAN-8' | 'UPC-A' | 'EAN-13';

const FORMAT_BY_LENGTH: Record<number, GtinFormat> = { 8: 'EAN-8', 12: 'UPC-A', 13: 'EAN-13' };

export type ManualCodeCheck =
  | { status: 'incomplete' }
  | { status: 'invalid'; format: GtinFormat }
  | { status: 'valid'; format: GtinFormat; code: string };

/**
 * Checks a hand-typed code before any network call: a GTIN length (8, 12 or 13 digits),
 * then its check digit. `code` is the normalized form to look up.
 */
export function checkManualCode(input: string): ManualCodeCheck {
  const format = /^\d+$/.test(input) ? FORMAT_BY_LENGTH[input.length] : undefined;
  if (!format) return { status: 'incomplete' };
  const code = normalizeGtin(input);
  return code ? { status: 'valid', format, code } : { status: 'invalid', format };
}

/** Groups the digits as printed under the bars: `3 760123 456784`, `9638 5074`. */
export function formatGtin(code: string): string {
  switch (code.length) {
    case 13:
      return `${code[0]} ${code.slice(1, 7)} ${code.slice(7)}`;
    case 12:
      return `${code[0]} ${code.slice(1, 6)} ${code.slice(6, 11)} ${code[11]}`;
    case 8:
      return `${code.slice(0, 4)} ${code.slice(4)}`;
    default:
      return code;
  }
}

// EAN symbol encoding: each digit is 7 modules (`1` = bar).
const L_CODES = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G_CODES = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R_CODES = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
/** EAN-13: the first digit is not drawn, it sets which left digits use the G set. */
const EAN13_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
const EDGE_GUARD = '101';
const CENTER_GUARD = '01010';

/**
 * Bar pattern of an EAN-13 (95 modules) or EAN-8 (67 modules); a UPC-A is drawn as its EAN-13
 * form. `null` for anything that is not a valid GTIN.
 */
export function eanBarModules(input: string): string | null {
  const code = normalizeGtin(input);
  if (!code) return null;
  const digits = [...code].map(Number);

  if (code.length === 8) {
    const left = digits.slice(0, 4).map((d) => L_CODES[d]);
    const right = digits.slice(4).map((d) => R_CODES[d]);
    return EDGE_GUARD + left.join('') + CENTER_GUARD + right.join('') + EDGE_GUARD;
  }

  const parity = EAN13_PARITY[digits[0]];
  const left = digits.slice(1, 7).map((d, i) => (parity[i] === 'G' ? G_CODES : L_CODES)[d]);
  const right = digits.slice(7).map((d) => R_CODES[d]);
  return EDGE_GUARD + left.join('') + CENTER_GUARD + right.join('') + EDGE_GUARD;
}
