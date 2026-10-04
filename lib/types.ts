// WooCommerce Store API (/wp-json/wc/store/v1) response shapes, only the fields we use

export type Image = { id: number; src: string; thumbnail: string; alt: string };

export type Prices = {
  price: string; // minor units, e.g. "339000"
  regular_price: string;
  sale_price: string;
  currency_minor_unit: number;
  currency_symbol: string;
};

export type Category = { id: number; name: string; slug: string; count?: number };

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  on_sale: boolean;
  is_in_stock: boolean;
  is_purchasable: boolean;
  prices: Prices;
  images: Image[];
  categories: Category[];
};

export type CartItem = {
  id: number;
  slug: string;
  name: string;
  image?: string;
  price: number; // display only; the real price comes from WooCommerce at checkout
  qty: number;
};
