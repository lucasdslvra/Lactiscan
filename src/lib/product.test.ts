import { describe, expect, it } from '@jest/globals';

import type { OffProduct } from '@/lib/off';
import { brandLine, categoryLabel, photoUrl, productIngredients, productName } from '@/lib/product';

const base: OffProduct = { code: '3760123456784' };

describe('productName', () => {
  it('prefers the French name', () => {
    expect(productName({ ...base, product_name: 'Sliced brioche', product_name_fr: 'Brioche tranchée' })).toBe(
      'Brioche tranchée'
    );
  });

  it('falls back to the generic name, then to a placeholder', () => {
    expect(productName({ ...base, product_name: 'Sliced brioche', product_name_fr: ' ' })).toBe('Sliced brioche');
    expect(productName(base)).toBe('Produit sans nom');
  });
});

describe('productIngredients', () => {
  it('prefers the French list', () => {
    const product = { ...base, ingredients_text: 'Wheat flour, butter.', ingredients_text_fr: 'Farine de blé, beurre.' };
    expect(productIngredients(product)).toEqual({ text: 'Farine de blé, beurre.', lang: 'fr' });
  });

  it('falls back to the original language', () => {
    const product = { ...base, ingredients_text: 'Wheat flour, butter.', ingredients_text_fr: '' };
    expect(productIngredients(product)).toEqual({ text: 'Wheat flour, butter.', lang: 'other' });
  });

  it('removes the `_allergen_` marks of contributors', () => {
    const product = { ...base, ingredients_text_fr: 'Sucre, _lait_ écrémé en poudre, sel_marin.' };
    expect(productIngredients(product)?.text).toBe('Sucre, lait écrémé en poudre, sel_marin.');
  });

  it('returns null without ingredients', () => {
    expect(productIngredients(base)).toBeNull();
  });
});

describe('brandLine', () => {
  it('joins the first brand and the quantity', () => {
    expect(brandLine({ ...base, brands: 'Marque A, Groupe X', quantity: '500 g' })).toBe('Marque A · 500 g');
  });

  it('keeps whichever part exists', () => {
    expect(brandLine({ ...base, brands: 'Marque A' })).toBe('Marque A');
    expect(brandLine({ ...base, quantity: '1 L' })).toBe('1 L');
    expect(brandLine(base)).toBeNull();
  });
});

describe('categoryLabel', () => {
  it('returns the most specific category in capitals', () => {
    expect(categoryLabel({ ...base, categories: 'Viennoiseries, Brioches, Brioches tranchées' })).toBe(
      'BRIOCHES TRANCHÉES'
    );
  });

  it('skips raw taxonomy tags', () => {
    expect(categoryLabel({ ...base, categories: 'Pâtes à tartiner, fr:Nutella, fr:Nuttela' })).toBe(
      'PÂTES À TARTINER'
    );
    expect(categoryLabel({ ...base, categories: 'en:sliced-brioches' })).toBeNull();
    expect(categoryLabel(base)).toBeNull();
  });
});

describe('photoUrl', () => {
  it('prefers the full front image, then the small one', () => {
    expect(photoUrl({ ...base, image_front_url: 'https://a/400.jpg', image_front_small_url: 'https://a/200.jpg' })).toBe(
      'https://a/400.jpg'
    );
    expect(photoUrl({ ...base, image_front_small_url: 'https://a/200.jpg' })).toBe('https://a/200.jpg');
    expect(photoUrl(base)).toBeNull();
  });
});
