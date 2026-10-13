# Équivalences

`equivalences.json` liste ce qui remplace les produits laitiers. L'app Lactiscan le télécharge au lancement, au plus une fois par jour, depuis :

https://raw.githubusercontent.com/lucasdslvra/Lactiscan/main/equivalences/equivalences.json

L'app embarque aussi ce même fichier, pour fonctionner sans réseau ou au premier lancement.

## Format

Le format est défini par `equivalences.schema.json`, l'unique source de vérité. Le fichier a trois parties :

- **`version`** : date de génération, au format `AAAA-MM-JJ`. Elle change à chaque modification du fichier.
- **`manual`** : équivalences génériques écrites à la main. Le script de génération n'y touche jamais. Chaque entrée contient :
  - `id` : identifiant stable et unique, par exemple `creme-fraiche` ;
  - `name` : nom affiché et recherché ;
  - `synonyms` : au moins un autre nom pour la recherche. Inutile de varier la casse ou les accents, la recherche les ignore ;
  - `categoryTags` : catégories Open Food Facts où trouver des produits de remplacement (les clés de `auto`) ;
  - `replacements` : chaque remplacement a un `name`, une `note` facultative et un `mode`.
    - `strict` : aucun ingrédient laitier, convient aux deux profils.
    - `lactose-free` : contient du lait sans lactose, convient seulement au profil « Sans lactose ».
- **`auto`** : produits sans lait les plus populaires, classés par tag de catégorie Open Food Facts. Le script hebdomadaire la régénère.

`types.d.ts` est généré depuis le schéma et importé par l'app via `@equivalences/types`. Il ne faut pas le modifier à la main.

## Commandes

```bash
npm ci
npm run validate          # schéma, id uniques, aucun synonyme partagé entre deux entrées
npm run validate -- autre.json
npm run types             # régénère types.d.ts après une modification du schéma
```

La CI (`.github/workflows/equivalences.yml`) lance les deux vérifications à chaque modification de ce dossier.
