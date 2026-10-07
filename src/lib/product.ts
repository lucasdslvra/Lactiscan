import type { OffProduct } from '@/lib/off';

export interface ProductIngredients {
  text: string;
  /** `fr` when the French list exists, otherwise the product's original language. */
  lang: 'fr' | 'other';
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function productName(product: OffProduct): string {
  return clean(product.product_name_fr) ?? clean(product.product_name) ?? 'Produit sans nom';
}

/** Ingredients in French first, then in the original language; `null` when OFF has none. */
export function productIngredients(product: OffProduct): ProductIngredients | null {
  const fr = clean(product.ingredients_text_fr);
  if (fr) return { text: fr, lang: 'fr' };
  const other = clean(product.ingredients_text);
  return other ? { text: other, lang: 'other' } : null;
}

/** « Marque A · 500 g »: the first brand only, as OFF lists brands and owners together. */
export function brandLine(product: OffProduct): string | null {
  const brand = clean(product.brands?.split(',')[0]);
  const parts = [brand, clean(product.quantity)].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Most specific readable category; raw tags (`fr:Nutella`) left by contributors are skipped. */
export function categoryLabel(product: OffProduct): string | null {
  const readable = (product.categories ?? '')
    .split(',')
    .map((category) => category.trim())
    .filter((category) => category && !/^[a-z]{2}:/.test(category));
  return readable.at(-1)?.toLocaleUpperCase('fr-FR') ?? null;
}

export function photoUrl(product: OffProduct): string | null {
  return clean(product.image_front_url) ?? clean(product.image_front_small_url) ?? null;
}
