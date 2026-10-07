export const OFF_BASE_URL = 'https://world.openfoodfacts.org';

/**
 * Open Food Facts asks every client to identify itself with `AppName/Version (contact)`.
 * Set EXPO_PUBLIC_OFF_CONTACT (e.g. in `.env.local`) to a real contact address.
 */
const OFF_CONTACT = process.env.EXPO_PUBLIC_OFF_CONTACT ?? 'contact@exemple.fr';

export const OFF_USER_AGENT = `MilkApp/1.0 (${OFF_CONTACT})`;

export const OFF_TIMEOUT_MS = 10_000;

/**
 * The only fields MilkApp reads. Sent as `fields=` on every request so OFF does
 * not return the full (very large) product document.
 */
export const OFF_PRODUCT_FIELDS = [
  'code',
  'product_name',
  'product_name_fr',
  'brands',
  'quantity',
  'image_front_url',
  'image_front_small_url',
  'ingredients_text',
  'ingredients_text_fr',
  'allergens_tags',
  'traces_tags',
  'labels_tags',
  'categories',
  'categories_tags',
  'states_tags',
  'nutriscore_grade',
  'unique_scans_n',
] as const;
