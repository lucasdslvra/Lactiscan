import type { OFF_PRODUCT_FIELDS } from './config';

/** Product fields as returned by Open Food Facts. Any field may be missing on a sparse product. */
interface OffProductDocument {
  code: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  ingredients_text?: string;
  ingredients_text_fr?: string;
  /** e.g. `['en:milk', 'en:soybeans']` */
  allergens_tags?: string[];
  traces_tags?: string[];
  /** e.g. `['en:no-lactose']` */
  labels_tags?: string[];
  /** From most generic to most specific. */
  categories_tags?: string[];
  /** Completeness flags, e.g. `en:ingredients-to-be-completed`. */
  states_tags?: string[];
  nutriscore_grade?: string;
  unique_scans_n?: number;
}

type OffProductField = (typeof OFF_PRODUCT_FIELDS)[number];

/** Exactly the fields requested through `fields=`, so the type cannot drift from the request. */
export type OffProduct = Pick<OffProductDocument, OffProductField>;

export interface OffProductResponse {
  code: string;
  status: 0 | 1;
  status_verbose: string;
  product?: OffProduct;
}

/** Subset of the `sort_by` values accepted by `/api/v2/search`. */
export type OffSortBy =
  | 'unique_scans_n'
  | 'scans_n'
  | 'popularity_key'
  | 'nutriscore_score'
  | 'last_modified_t';

export interface OffSearchParams {
  /** Category tag, e.g. `en:plant-based-milk-alternatives`. */
  categoryTag?: string;
  /** Country tag, e.g. `en:france`. */
  countryTag?: string;
  sortBy?: OffSortBy;
  /** 1-based. */
  page?: number;
  pageSize?: number;
}

export interface OffSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  skip: number;
  products: OffProduct[];
}
