/* Généré depuis equivalences.schema.json par npm run types, ne pas modifier à la main. */

/**
 * Tag de catégorie de la taxonomie Open Food Facts, par exemple `en:margarines`.
 */
export type CategoryTag = string;
/**
 * `strict` : sans aucun ingrédient laitier, convient aux deux profils. `lactose-free` : contient du lait sans lactose, convient seulement au profil « Sans lactose ».
 */
export type MilkMode = "lactose-free" | "strict";

/**
 * Équivalences sans lait lues par l'app Lactiscan et régénérées par le script hebdomadaire.
 */
export interface EquivalencesFile {
  /**
   * Chemin du schéma, pour l'autocomplétion dans l'éditeur.
   */
  $schema?: string;
  /**
   * Date de génération (AAAA-MM-JJ), pour savoir quelle version chaque téléphone utilise.
   */
  version: string;
  /**
   * Équivalences génériques écrites à la main. Le script ne la modifie jamais.
   */
  manual: ManualEquivalence[];
  /**
   * Produits sans lait les plus populaires, par tag de catégorie Open Food Facts. Générée par le script.
   */
  auto: {
    [k: string]: AutoProduct[];
  };
}
/**
 * Un aliment laitier courant et ce qui peut le remplacer.
 */
export interface ManualEquivalence {
  /**
   * Identifiant stable, unique dans le fichier.
   */
  id: string;
  /**
   * Nom affiché et recherché, par exemple « Beurre ».
   */
  name: string;
  /**
   * Autres noms reconnus par la recherche.
   *
   * @minItems 1
   */
  synonyms: [string, ...string[]];
  /**
   * Catégories Open Food Facts où trouver des produits de remplacement : les clés de `auto` affichées avec cette entrée.
   */
  categoryTags: CategoryTag[];
  /**
   * @minItems 1
   */
  replacements: [Replacement, ...Replacement[]];
}
export interface Replacement {
  name: string;
  mode: MilkMode;
  /**
   * Conseil affiché sous le remplacement.
   */
  note?: string;
}
/**
 * Produit Open Food Facts, limité aux champs lus par l'app.
 */
export interface AutoProduct {
  code: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  ingredients_text?: string;
  ingredients_text_fr?: string;
  allergens_tags?: string[];
  traces_tags?: string[];
  labels_tags?: string[];
  categories?: string;
  categories_tags?: string[];
  states_tags?: string[];
  nutriscore_grade?: string;
  unique_scans_n?: number;
}
