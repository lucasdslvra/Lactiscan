export interface IngredientPart {
  text: string;
  dairy: boolean;
}

export interface DairyIngredients {
  /** Consecutive parts of the text; joined, they give back the text unchanged. */
  parts: IngredientPart[];
  /** Highlighted ingredients, without allergen clarifications such as « (de lait) ». */
  names: string[];
}

// Matched on the accent-folded, lower-case text, as whole words.
const DAIRY_TERMS = [
  // French
  'lait', 'laits', 'laitier', 'laitiere', 'laitiers', 'laitieres', 'lactose', 'lactoserum',
  'babeurre', 'beurre', 'beurres', 'creme', 'cremes', 'fromage', 'fromages', 'caseine',
  'caseines', 'caseinate', 'caseinates', 'lactalbumine', 'lactoglobuline', 'yaourt', 'yaourts',
  'yoghourt', 'ghee', 'mascarpone', 'ricotta', 'mozzarella', 'emmental', 'emmenthal',
  'parmesan', 'comte', 'cheddar', 'gouda',
  // English, for sheets only filled in the original language
  'milk', 'butter', 'buttermilk', 'cream', 'cheese', 'whey', 'casein', 'caseinate', 'yogurt',
  'yoghurt', 'curd',
];

const WORD_CHAR = 'a-z0-9œæ';
const DAIRY_RE = new RegExp(`(^|[^${WORD_CHAR}])(${DAIRY_TERMS.join('|')})(?![${WORD_CHAR}])`, 'g');

// « beurre de cacao », « lait d'amande », « crème de marrons »…
const PLANT_AFTER_RE =
  /^\s+(de|d['’])\s*(la\s+)?(noix\s+de\s+)?(cacao|karite|coco|amandes?|soja|avoine|riz|noisettes?|cajou|arachides?|cacahuetes?|marrons?|chataignes?|sesame)(?![a-z])/;
// « cocoa butter », « coconut milk », « oat milk »…
const PLANT_BEFORE_RE =
  /(^|[^a-z])(cocoa|coconut|peanut|shea|almond|soy|soya|oat|rice|cashew|hazelnut|nut)\s*$/;

// Highlighting stops at the « may contain » sentence: traces are shown in their own box.
const TRACES_START_RE =
  /(^|[^a-z])(peut contenir|peut aussi contenir|traces? (eventuelles? )?(de|d['’])|fabrique dans un atelier|may contain)/;

const TRAILING_PERCENT_RE = /\s*\d+(?:[.,]\d+)?\s*%\s*$/;

const ACCENTS: Record<string, string> = {
  à: 'a', â: 'a', ä: 'a', ç: 'c', é: 'e', è: 'e', ê: 'e', ë: 'e',
  î: 'i', ï: 'i', ô: 'o', ö: 'o', ù: 'u', û: 'u', ü: 'u', ÿ: 'y',
};

/** Lower case without accents, one character for one character so indexes still match. */
function fold(text: string): string {
  let folded = '';
  for (const char of text.toLowerCase()) {
    folded += char.length === 1 ? (ACCENTS[char] ?? char) : char;
  }
  return folded.length === text.length ? folded : text.toLowerCase();
}

function isDelimiter(text: string, i: number): boolean {
  const char = text[i];
  if (',.'.includes(char)) {
    // « 6,6 % » and « 10.5 » stay whole.
    return !(/\d/.test(text[i - 1] ?? '') && /\d/.test(text[i + 1] ?? ''));
  }
  return ';()[]:\r\n'.includes(char);
}

function containsDairy(folded: string): boolean {
  for (const match of folded.matchAll(DAIRY_RE)) {
    const start = match.index + match[1].length;
    const end = start + match[2].length;
    if (!PLANT_AFTER_RE.test(folded.slice(end)) && !PLANT_BEFORE_RE.test(folded.slice(0, start))) {
      return true;
    }
  }
  return false;
}

/**
 * Splits an ingredient list into ingredients and highlights whole dairy ones (« lait écrémé
 * en poudre »), leaving out edge spaces and a trailing percentage.
 */
export function findDairyIngredients(text: string): DairyIngredients {
  const folded = fold(text);
  const tracesMatch = TRACES_START_RE.exec(folded);
  const tracesStart = tracesMatch ? tracesMatch.index + tracesMatch[1].length : text.length;

  const parts: IngredientPart[] = [];
  const names: string[] = [];
  const pushPlain = (chunk: string) => {
    if (!chunk) return;
    const last = parts.at(-1);
    if (last && !last.dairy) last.text += chunk;
    else parts.push({ text: chunk, dairy: false });
  };

  let previousWasDairy = false;
  let start = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i < text.length && !isDelimiter(text, i)) continue;

    const segment = text.slice(start, i);
    const checked = folded.slice(start, Math.min(i, tracesStart));
    const delimiter = text[i] ?? '';

    if (start < tracesStart && containsDairy(checked)) {
      const leading = segment.length - segment.trimStart().length;
      const core = segment.trim().replace(TRAILING_PERCENT_RE, '');
      pushPlain(segment.slice(0, leading));
      parts.push({ text: core, dairy: true });
      pushPlain(segment.slice(leading + core.length));
      // « perméat de lactosérum (de lait) »: the parenthesis only names the allergen.
      const clarification = previousWasDairy && text[start - 1] === '(';
      if (!clarification) names.push(core);
      previousWasDairy = true;
    } else {
      pushPlain(segment);
      // A parenthesis opened right after a dairy ingredient still belongs to it.
      if (segment.trim() || delimiter !== '(') previousWasDairy = false;
    }

    pushPlain(delimiter);
    start = i + 1;
  }

  return { parts, names };
}
