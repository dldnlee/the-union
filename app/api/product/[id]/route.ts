import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ProductWithVariants } from '@/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product with all related data
    const { data: product, error: productError } = await supabase
      .from('tu_product')
      .select('*')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch variants for this product
    const { data: variants, error: variantsError } = await supabase
      .from('tu_product_variant')
      .select('*')
      .eq('product_id', id);

    if (variantsError) {
      return NextResponse.json(
        { error: 'Failed to fetch product variants' },
        { status: 500 }
      );
    }

    // For each variant, fetch its options and images
    const variantsWithDetails = await Promise.all(
      (variants || []).map(async (variant) => {
        // Fetch variant option mappings
        const { data: optionMaps } = await supabase
          .from('tu_variant_option_map')
          .select('option_value_id')
          .eq('variant_id', variant.id);

        // Fetch option values with their types
        const optionValueIds = optionMaps?.map(m => m.option_value_id) || [];
        const { data: optionValues } = await supabase
          .from('tu_option_value')
          .select(`
            *,
            option_type:tu_option_type(*)
          `)
          .in('id', optionValueIds);

        // Fetch variant images
        const { data: images } = await supabase
          .from('tu_variant_image')
          .select('*')
          .eq('variant_id', variant.id)
          .order('sort_order', { ascending: true });

        // Fetch inventory stock with delivery methods
        const { data: inventory } = await supabase
          .from('tu_inventory_stock')
          .select(`
            quantity_available,
            delivery_method:tu_delivery_method(*)
          `)
          .eq('variant_id', variant.id);

        return {
          ...variant,
          options: optionValues || [],
          images: images || [],
          inventory_stock: inventory || [],
        };
      })
    );

    const productWithVariants: ProductWithVariants = {
      ...product,
      variants: variantsWithDetails,
    };

    return NextResponse.json(productWithVariants, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
