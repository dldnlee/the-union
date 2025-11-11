


// Order Models

export type Order = {
  id: string; // primary key
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customs_code: string;
  order_date: string;
  total_amount: number; // final price the customer has paid including taxes/shipping
  status: string; // Pending, Processing, Shipped, Delivered, Canceled
  payment_status: string; // Paid, Pending, Failed
  delivery_method_id: string; // Foreign key to delivery_method
}

export type OrderItem = {
  id: string; // primary key
  order_id: string; // Foreign key to Order
  variant_id: string; // Foreign key to ProductVariant
  quantity: number;
  price_at_purchase: number;
  subtotal: number; // quantity + price_at_purchase
  sku_snapshop: string;
}

// Product Models

export type Product = {
  id: string; // primary key
  name: string;
  description: string;
  base_price: number;
}

export type OptionType = {
  id: string; // primary key
  name: string; // color, size, version
}

export type OptionValue = {
  id: string; // primary key
  option_type_id: string; // foreign key to OptionType
  value: string; // hexcode / small / pro
}

export type ProductVariant = {
  id: string;
  product_id: string; // Foreign key to Product
  sku: string; // unique stock keeping unit
  price_adjustment: number; // the amount to add / subtact from base price
}

export type VariantOptionMap = {
  variant_id: string; // Foreign key to ProductVariant
  option_value_id: string; // Foreign key to OptionValue
  //composite primary key?
}

// Delivery Method Tables

export type DeliveryMethod = {
  id: string;
  name: string; // 'Local', 'International', 'Onsite'
  description: string; // nullable
}

// Inventory Management

export type InventoryStock = {
  id: string;
  variant_id: string; // Foreign key to ProductVariant
  method_id: string; // Foreign key to DeliveryMethod
  quantity_available: number;
  // Unique Constraint variant_id, method_id
}

// Images for variants
export type VariantImage = {
  id: string;
  variant_id: string; // Foreign Key to ProductVariant
  image_url: string;
  sort_order: number;
  is_main: boolean;
}

// Extended types for API responses

export type OptionValueWithType = OptionValue & {
  option_type?: OptionType;
}

export type ProductVariantWithDetails = ProductVariant & {
  options: OptionValueWithType[];
  images: VariantImage[];
}

export type ProductWithVariants = Product & {
  variants: ProductVariantWithDetails[];
}