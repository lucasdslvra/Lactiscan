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
- **`auto`** : produits sans lait les plus populaires, classés par tag de catégorie Open Food Facts. Le script `generate.ts` la régénère (voir plus bas).

`types.d.ts` est généré depuis le schéma et importé par l'app via `@equivalences/types`. Il ne faut pas le modifier à la main.

## Commandes

```bash
npm ci
npm run generate          # interroge Open Food Facts et régénère auto (environ 1 min)
npm run generate -- autre.json
npm run validate          # schéma, id uniques, aucun synonyme partagé entre deux entrées
npm run validate -- autre.json
npm run types             # régénère types.d.ts après une modification du schéma
```

La CI (`.github/workflows/equivalences.yml`) lance les deux vérifications à chaque modification de ce dossier.

## Génération de `auto`

`generate.ts` (TypeScript, lancé par `tsx`) réutilise le client Open Food Facts de l'app, donc son User-Agent `MilkApp/1.0 (contact)`. Le contact vient de `EXPO_PUBLIC_OFF_CONTACT`. Pour chaque catégorie citée dans `manual` :

- il cherche les produits vendus en France, triés par nombre de scans (100 résultats par page) ;
- il garde, pour chacun des trois filtres de l'app, les 10 plus scannés que le moteur de verdict accepte :
  - « sans lait strict, traces exclues » : aucun lait, aucune trace ;
  - « sans lait strict » : aucun lait, traces permises ;
  - « sans lactose » : idem, plus les produits laitiers portant le label « sans lactose ».

  Les trois listes sont fusionnées, donc une catégorie compte entre 10 et 30 produits. Une fiche incomplète n'est jamais retenue ;
- tant que le filtre « traces exclues » a moins de 10 produits (chocolat noir, sorbets…), il lit la page suivante, jusqu'à 3 pages ;
- il ne garde que les champs prévus par le schéma, sans le nom ni les ingrédients non français quand ils sont identiques aux versions françaises.

Une catégorie peut ne servir qu'à un profil : `en:lactose-free-yogurts` ou `en:milks` n'apportent que des produits sans lactose, que l'app ne montre pas au profil strict.

Seules les valeurs de `auto` et `version` (date du jour) sont réécrites. `manual` et le reste du fichier restent identiques octet pour octet ; le script le vérifie avant d'écrire. Si `auto` n'a pas changé, le fichier n'est pas touché.

Les requêtes partent une par une, toutes les 7 s (la recherche OFF est limitée à 10 requêtes par minute). Open Food Facts répond souvent 503 : une erreur réseau, un timeout, un 429 ou un 5xx est retenté jusqu'à 4 fois, à 30 s d'intervalle.

Quand Open Food Facts ne répond pas pour une catégorie, même après ces essais, la catégorie **garde sa liste précédente** (vide si elle est nouvelle). Le script continue avec un avertissement, visible en annotation sur le workflow. Une page supplémentaire en erreur ne fait que compléter moins de produits.

Le script **échoue sans rien écrire** dans deux cas :

- plus de la moitié des catégories restent sans réponse : Open Food Facts est alors indisponible plutôt que surchargé ;
- une catégorie a répondu mais n'a de produit pour aucun des trois filtres. Vérifier alors que le tag existe bien chez Open Food Facts.

### Mise à jour hebdomadaire

`.github/workflows/equivalences-auto.yml` tourne chaque lundi à 5 h UTC. Il peut aussi être lancé à la main (onglet Actions, « Run workflow »). Il enchaîne `npm run generate` puis `npm run validate`, et ne commite que si `equivalences.json` a changé, avec le message `chore : produits auto des équivalences du AAAA-MM-JJ`.

Si une étape échoue, rien n'est commité et GitHub envoie sa notification d'échec. Pour un workflow planifié, elle part à la dernière personne qui a modifié le cron.

À configurer dans le dépôt :

- la variable `OFF_CONTACT` (Settings › Secrets and variables › Actions › Variables) : une adresse de contact envoyée à Open Food Facts ;
- l'autorisation pour les workflows de pousser sur `main`, si la branche est protégée.
