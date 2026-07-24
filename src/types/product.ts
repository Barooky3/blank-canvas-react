export type ProductCategory = 'men' | 'women' | 'unisex' | 'bundle';

export interface ProductVariant {
  ml: number;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  label?: string;
  note?: string;
  galleryImage?: string; // Optional per-variant AI gallery image shown in product detail
}


export interface BundleFragrance {
  name: string;
  topNote: string;
  heartNote: string;
  baseNote: string;
  accentColor: string;
  affiliateUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number; // Base price (smallest variant)
  originalPrice?: number;
  category: ProductCategory;
  description: string;
  scentNotes?: {
    top: string[];
    heart: string[];
    base: string[];
  };
  scentNoteImages?: Record<string, string>;
  scentNotesImage?: string;
  accentColor?: string; // HSL color matching the bottle/juice
  image: string;
  additionalImages?: string[];
  affiliateUrl: string;
  inStock: boolean;
  featured?: boolean;
  variants?: ProductVariant[]; // ML options
  isBundle?: boolean;
  bundleContents?: BundleFragrance[]; // Fragrances in a bundle
  imagePadding?: string;
  bundleImages?: string[]; // Multiple product images for composite bundle display
  hotDeal?: boolean; // Show fire discount badge
  addedAt?: string; // ISO date when product was added to the store
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedMl?: number; // Selected ML variant
  selectedPrice?: number; // Price for selected variant
}
