import { describe, expect, it } from '@jest/globals';

import { findDairyIngredients } from '@/lib/dairy';

function highlighted(text: string): string[] {
  return findDairyIngredients(text)
    .parts.filter((part) => part.dairy)
    .map((part) => part.text);
}

// Ingredient lists as found on Open Food Facts.
const MOCKUP =
  'Farine de blé, sucre, œufs frais (12 %), beurre (10 %), levure, lait écrémé en poudre, sel, émulsifiant : lécithine de colza, arôme naturel.';
const NUTELLA =
  'Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines [SOJA), vanilline. Sans gluten.';
const BELVITA =
  'Céréale 50 % (Farine de blé 34,8 %, farine de blé complet 15,2 %), sucre, huiles végétales (palme, colza), sel, lait écrémé en poudre, perméat de lactosérum (de lait), arômes. Peut contenir œuf.';
const BISCUIT_WORKSHOP =
  "Farine de blé 57%, sucre de canne roux, huile de colza, sel de mer.\r\n\r\nFabriqué dans un atelier qui utilise des fruits à coque, du lait, du lupin et du soja";

describe('findDairyIngredients', () => {
  it('highlights whole dairy ingredients, as in the mockup', () => {
    const { names } = findDairyIngredients(MOCKUP);
    expect(highlighted(MOCKUP)).toEqual(['beurre', 'lait écrémé en poudre']);
    expect(names).toEqual(['beurre', 'lait écrémé en poudre']);
  });

  it('matches capitals and missing accents, and leaves the percentage out', () => {
    expect(highlighted(NUTELLA)).toEqual(['LAIT écrémé en poudre', 'LACTOSERUM en poudre']);
  });

  it('does not count an allergen clarification as another ingredient', () => {
    const { names } = findDairyIngredients(BELVITA);
    expect(highlighted(BELVITA)).toEqual([
      'lait écrémé en poudre',
      'perméat de lactosérum',
      'de lait',
    ]);
    expect(names).toEqual(['lait écrémé en poudre', 'perméat de lactosérum']);
  });

  it('highlights nothing in the « may contain » sentence', () => {
    expect(highlighted(BISCUIT_WORKSHOP)).toEqual([]);
    expect(highlighted('Sucre, cacao. Peut contenir des traces de lait.')).toEqual([]);
    expect(highlighted('Sucre, cacao. Traces éventuelles de lait.')).toEqual([]);
  });

  it('keeps a dairy ingredient as the only one', () => {
    expect(findDairyIngredients('LAIT (origine France), sel, ferments, conservateur : E235').names).toEqual([
      'LAIT',
    ]);
  });

  it('counts nested dairy ingredients', () => {
    const text = 'Chocolat au lait (sucre, beurre de cacao, lait entier en poudre), crème fraîche';
    expect(findDairyIngredients(text).names).toEqual([
      'Chocolat au lait',
      'lait entier en poudre',
      'crème fraîche',
    ]);
  });

  it.each([
    'beurre de cacao',
    'lait de coco',
    "lait d'amande",
    'boisson à la crème de riz',
    'crème de marrons',
    'beurre de cacahuète',
    'lait de noix de coco',
    'cocoa butter',
    'coconut milk',
    'oat milk',
    'acide lactique',
    'lactate de calcium',
    'cacao maigre',
  ])('does not highlight « %s »', (text) => {
    expect(highlighted(`Sucre, ${text}, sel.`)).toEqual([]);
  });

  it.each(['caséinate de sodium', 'protéines de lait', 'fromage de chèvre', 'babeurre', 'whey powder', 'skimmed milk'])(
    'highlights « %s »',
    (text) => {
      expect(highlighted(`Sucre, ${text}, sel.`)).toEqual([text]);
    }
  );

  it('gives back the text unchanged when the parts are joined', () => {
    for (const text of [MOCKUP, NUTELLA, BELVITA, BISCUIT_WORKSHOP, '']) {
      const joined = findDairyIngredients(text)
        .parts.map((part) => part.text)
        .join('');
      expect(joined).toBe(text);
    }
  });
});
