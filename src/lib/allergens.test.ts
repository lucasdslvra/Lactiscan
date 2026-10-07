import { describe, expect, it } from '@jest/globals';

import { allergenLabel, tracesSentence } from '@/lib/allergens';

describe('allergenLabel', () => {
  it('names EU allergens in French with their article', () => {
    expect(allergenLabel('en:sesame-seeds')).toBe('du sésame');
    expect(allergenLabel('en:mustard')).toBe('de la moutarde');
  });

  it('keeps an unknown tag readable', () => {
    expect(allergenLabel('en:kiwi-fruit')).toBe('kiwi fruit');
  });
});

describe('tracesSentence', () => {
  it('lists the traces and states that milk is not among them', () => {
    expect(tracesSentence(['en:nuts', 'en:sesame-seeds'])).toBe(
      'Peut contenir des fruits à coque et du sésame. Aucune trace de lait signalée.'
    );
  });

  it('does not deny milk when milk is listed', () => {
    expect(tracesSentence(['en:milk', 'en:eggs', 'en:nuts'])).toBe(
      'Peut contenir du lait, des œufs et des fruits à coque.'
    );
  });

  it('handles an empty or missing list', () => {
    expect(tracesSentence([])).toBe('Aucune trace signalée.');
    expect(tracesSentence(undefined)).toBe('Aucune trace signalée.');
  });
});
