/** The 14 EU allergens as Open Food Facts tags them, with the partitive article French uses. */
const ALLERGEN_FR: Record<string, string> = {
  'en:milk': 'du lait',
  'en:gluten': 'du gluten',
  'en:eggs': 'des œufs',
  'en:nuts': 'des fruits à coque',
  'en:peanuts': 'des arachides',
  'en:soybeans': 'du soja',
  'en:sesame-seeds': 'du sésame',
  'en:fish': 'du poisson',
  'en:crustaceans': 'des crustacés',
  'en:molluscs': 'des mollusques',
  'en:celery': 'du céleri',
  'en:mustard': 'de la moutarde',
  'en:lupin': 'du lupin',
  'en:sulphur-dioxide-and-sulphites': 'des sulfites',
};

/** `en:sesame-seeds` → « du sésame »; an unknown tag keeps its name without prefix or dashes. */
export function allergenLabel(tag: string): string {
  return ALLERGEN_FR[tag] ?? tag.replace(/^[a-z]{2}:/, '').replaceAll('-', ' ');
}

/** « a, b et c » */
function joinFr(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
}

/**
 * Sentence of the « TRACES » box: « Peut contenir des fruits à coque et du sésame. Aucune
 * trace de lait signalée. », or « Aucune trace signalée. » when OFF lists none.
 */
export function tracesSentence(tracesTags: string[] | undefined): string {
  const tags = tracesTags ?? [];
  if (tags.length === 0) return 'Aucune trace signalée.';
  const sentence = `Peut contenir ${joinFr(tags.map(allergenLabel))}.`;
  return tags.includes('en:milk') ? sentence : `${sentence} Aucune trace de lait signalée.`;
}
