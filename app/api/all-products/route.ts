import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch all products
    const { data: products, error: productsError } = await supabase
      .from('tu_product')
      .select('*');

    if (productsError) {
      return NextResponse.json(
        { error: 'Failed to fetch products', details: productsError.message },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all product variants
    const { data: variants, error: variantsError } = await supabase
      .from('tu_product_variant')
      .select('*');

    if (variantsError) {
      return NextResponse.json(
        { error: 'Failed to fetch variants', details: variantsError.message },
        { status: 500 }
      );
    }

    // Fetch all variant option mappings
    const { data: variantOptionMaps, error: variantOptionMapsError } = await supabase
      .from('tu_variant_option_map')
      .select('*');

    if (variantOptionMapsError) {
      return NextResponse.json(
        { error: 'Failed to fetch variant option maps', details: variantOptionMapsError.message },
        { status: 500 }
      );
    }

    // Fetch all option values
    const { data: optionValues, error: optionValuesError } = await supabase
      .from('tu_option_value')
      .select('*');

    if (optionValuesError) {
      return NextResponse.json(
        { error: 'Failed to fetch option values', details: optionValuesError.message },
        { status: 500 }
      );
    }

    // Fetch all option types
    const { data: optionTypes, error: optionTypesError } = await supabase
      .from('tu_option_type')
      .select('*');

    if (optionTypesError) {
      return NextResponse.json(
        { error: 'Failed to fetch option types', details: optionTypesError.message },
        { status: 500 }
      );
    }

    // Fetch all variant images
    const { data: variantImages, error: variantImagesError } = await supabase
      .from('tu_variant_image')
      .select('*')
      .order('sort_order', { ascending: true });

    if (variantImagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch variant images', details: variantImagesError.message },
        { status: 500 }
      );
    }

    // Build a lookup map for option types
    const optionTypeMap = new Map(optionTypes?.map(ot => [ot.id, ot]) || []);

    // Build a lookup map for option values with their types
    const optionValueMap = new Map(
      optionValues?.map(ov => [
        ov.id,
        {
          ...ov,
          option_type: optionTypeMap.get(ov.option_type_id)
        }
      ]) || []
    );

    // Build variants with their options and images
    const variantsWithOptions = variants?.map(variant => {
      const variantOptions = variantOptionMaps
        ?.filter(vom => vom.variant_id === variant.id)
        .map(vom => optionValueMap.get(vom.option_value_id))
        .filter(Boolean);

      const images = variantImages?.filter(img => img.variant_id === variant.id) || [];

      return {
        ...variant,
        options: variantOptions || [],
        images: images
      };
    }) || [];

    // Build the final response with products and their variants
    const productsWithVariants = products.map(product => ({
      ...product,
      variants: variantsWithOptions.filter(v => v.product_id === product.id)
    }));

    return NextResponse.json(productsWithVariants);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
