// Checks equivalences.json (or the file given as argument) against the schema, then the rules
// the schema cannot express. Exits with status 1 on the first invalid file.
//   node validate.mjs [file]
import Ajv from 'ajv';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = (name) => fileURLToPath(new URL(name, import.meta.url));

const schema = JSON.parse(await readFile(here('equivalences.schema.json'), 'utf8'));
const path = process.argv[2] ?? here('equivalences.json');

/** Same word for the search: no case, no accents, no surrounding spaces. */
function searchKey(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** Errors the schema cannot catch: duplicate ids, a name or synonym claimed by two entries. */
function crossEntryErrors({ manual }) {
  const errors = [];
  const ids = new Set();
  const owners = new Map();
  for (const entry of manual) {
    if (ids.has(entry.id)) errors.push(`manual : id « ${entry.id} » en double`);
    ids.add(entry.id);
    for (const term of new Set([entry.name, ...entry.synonyms].map(searchKey))) {
      const owner = owners.get(term);
      if (owner) errors.push(`manual : « ${term} » appartient à « ${owner} » et « ${entry.id} »`);
      else owners.set(term, entry.id);
    }
  }
  return errors;
}

let data;
try {
  data = JSON.parse(await readFile(path, 'utf8'));
} catch (error) {
  console.error(`${path} : illisible (${error.message})`);
  process.exit(1);
}

const validate = new Ajv({ allErrors: true }).compile(schema);
const errors = validate(data)
  ? crossEntryErrors(data)
  : validate.errors.map((error) => `${error.instancePath || '/'} ${error.message}`);

if (errors.length > 0) {
  console.error(`${path} : invalide`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const products = Object.values(data.auto).reduce((total, list) => total + list.length, 0);
console.log(
  `${path} : valide (version ${data.version}, ${data.manual.length} équivalences manuelles, ${products} produits auto)`
);
