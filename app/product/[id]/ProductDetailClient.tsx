"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { ProductWithVariants, OptionValueWithType, ProductVariantWithDetails } from "@/models";

interface VariantWithInventory extends ProductVariantWithDetails {
  inventory_stock?: Array<{
    quantity_available: number;
    delivery_method: {
      id: string;
      name: string;
      description: string;
    };
  }>;
}

interface ProductWithFullDetails extends Omit<ProductWithVariants, 'variants'> {
  variants: VariantWithInventory[];
}

interface ProductDetailClientProps {
  product: ProductWithFullDetails;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Extract all unique option types from variants
  const optionTypes = useMemo(() => {
    const types = new Map<string, { id: string; name: string; values: OptionValueWithType[] }>();

    product.variants.forEach((variant) => {
      variant.options?.forEach((option) => {
        if (option.option_type) {
          const typeId = option.option_type.id;
          const typeName = option.option_type.name;

          if (!types.has(typeId)) {
            types.set(typeId, {
              id: typeId,
              name: typeName,
              values: [],
            });
          }

          const typeData = types.get(typeId)!;
          if (!typeData.values.find(v => v.id === option.id)) {
            typeData.values.push(option);
          }
        }
      });
    });

    return Array.from(types.values());
  }, [product.variants]);

  // Extract all unique delivery methods from variants
  const deliveryMethods = useMemo(() => {
    const methods = new Map<string, { id: string; name: string; description: string }>();

    product.variants.forEach((variant) => {
      variant.inventory_stock?.forEach((stock) => {
        if (stock.delivery_method && stock.quantity_available > 0) {
          methods.set(stock.delivery_method.id, stock.delivery_method);
        }
      });
    });

    return Array.from(methods.values());
  }, [product.variants]);

  // Find matching variant based on selected options
  const selectedVariant = useMemo(() => {
    if (Object.keys(selectedOptions).length === 0) return null;

    return product.variants.find((variant) => {
      if (!variant.options || variant.options.length === 0) return false;

      return optionTypes.every((optionType) => {
        const selectedValueId = selectedOptions[optionType.id];
        if (!selectedValueId) return false;

        return variant.options?.some(
          (opt) => opt.id === selectedValueId
        );
      });
    });
  }, [selectedOptions, product.variants, optionTypes]);

  // Get available stock for selected variant and delivery method
  const availableStock = useMemo(() => {
    if (!selectedVariant || !selectedDeliveryMethod) return 0;

    const stock = selectedVariant.inventory_stock?.find(
      (s) => s.delivery_method.id === selectedDeliveryMethod
    );

    return stock?.quantity_available || 0;
  }, [selectedVariant, selectedDeliveryMethod]);

  // Calculate final price
  const finalPrice = useMemo(() => {
    if (!selectedVariant) return product.base_price;
    return product.base_price + selectedVariant.price_adjustment;
  }, [selectedVariant, product.base_price]);

  // Get images for display
  const displayImages = useMemo(() => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images.sort((a, b) => a.sort_order - b.sort_order);
    }

    // Fallback to first variant's images
    const firstVariantWithImages = product.variants.find(v => v.images && v.images.length > 0);
    return firstVariantWithImages?.images?.sort((a, b) => a.sort_order - b.sort_order) || [];
  }, [selectedVariant, product.variants]);

  const handleOptionChange = (optionTypeId: string, optionValueId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionTypeId]: optionValueId,
    }));
  };

  const isAddToCartDisabled =
    !selectedVariant ||
    !selectedDeliveryMethod ||
    availableStock <= 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {displayImages.length > 0 ? (
                <Image
                  src={displayImages[currentImageIndex]?.image_url || "/placeholder.png"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {displayImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                      currentImageIndex === index
                        ? "border-black"
                        : "border-gray-200"
                    }`}
                  >
                    <Image
                      src={image.image_url}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">TheUnion</p>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-2xl font-bold text-gray-900 mt-4">
                {finalPrice.toLocaleString("ko-KR")}원
              </p>
              {selectedVariant && selectedVariant.price_adjustment !== 0 && (
                <p className="text-sm text-gray-500">
                  Base price: {product.base_price.toLocaleString("ko-KR")}원
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>

            {/* Option Selectors */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              {optionTypes.map((optionType) => (
                <div key={optionType.id}>
                  <label className="block text-sm font-medium text-gray-900 mb-2 capitalize">
                    {optionType.name}
                  </label>
                  <select
                    value={selectedOptions[optionType.id] || ""}
                    onChange={(e) => handleOptionChange(optionType.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select {optionType.name}</option>
                    {optionType.values.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.value}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Delivery Method Selector */}
              {deliveryMethods.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Delivery Method
                  </label>
                  <select
                    value={selectedDeliveryMethod}
                    onChange={(e) => setSelectedDeliveryMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select delivery method</option>
                    {deliveryMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.description} ({method.name})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Stock Display */}
            {selectedVariant && selectedDeliveryMethod && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-700">
                  Stock available: <span className="font-semibold">{availableStock}</span>
                </p>
                {selectedVariant.sku && (
                  <p className="text-xs text-gray-500 mt-1">SKU: {selectedVariant.sku}</p>
                )}
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              disabled={isAddToCartDisabled}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
                isAddToCartDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800"
              }`}
            >
              {!selectedVariant
                ? "Select options"
                : !selectedDeliveryMethod
                ? "Select delivery method"
                : availableStock <= 0
                ? "Out of stock"
                : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
