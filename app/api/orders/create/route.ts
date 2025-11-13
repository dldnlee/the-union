import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Orders Creation API
 *
 * Creates an order in the database after successful payment verification.
 *
 * Expected request body:
 * {
 *   order: {
 *     name: string;
 *     email: string;
 *     phone_num: string;
 *     address?: string;
 *     delivery_method: '팬미팅현장수령' | '국내배송' | '해외배송';
 *     total_amount: number;
 *     payment_status?: 'Paid' | 'Pending' | 'Failed';
 *     shop_order_no?: string;
 *   };
 *   items: Array<{
 *     variantId?: string;
 *     productId?: string;
 *     quantity: number;
 *     price: number;
 *     sku?: string;
 *     option?: string;
 *     productName?: string;
 *   }>;
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const { order, items } = await request.json();

    // Validate required fields
    if (!order || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order data and items are required' },
        { status: 400 }
      );
    }

    // Validate required order fields
    if (!order.name || !order.email || !order.phone_num || !order.delivery_method || !order.total_amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required order fields (name, email, phone_num, delivery_method, total_amount)' },
        { status: 400 }
      );
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.variantId && !item.productId) {
        return NextResponse.json(
          { success: false, message: 'Each item must have either variantId or productId' },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, message: 'Each item must have a valid quantity > 0' },
          { status: 400 }
        );
      }
      if (item.price === undefined || item.price < 0) {
        return NextResponse.json(
          { success: false, message: 'Each item must have a valid price >= 0' },
          { status: 400 }
        );
      }
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration is missing');
      return NextResponse.json(
        { success: false, message: 'Database configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Map delivery method name to ID (using predefined UUIDs from schema)
    const deliveryMethodMap: Record<string, string> = {
      '팬미팅현장수령': '00000000-0000-0000-0000-000000000003', // onsite
      '국내배송': '00000000-0000-0000-0000-000000000001', // local
      '해외배송': '00000000-0000-0000-0000-000000000002', // international
    };

    const deliveryMethodId = deliveryMethodMap[order.delivery_method] || '00000000-0000-0000-0000-000000000003'; // default: onsite

    // Prepare order data for database
    const orderData = {
      customer_name: order.name,
      customer_email: order.email,
      customer_phone: order.phone_num,
      customer_address: order.address || '',
      customs_code: order.shop_order_no || '',
      order_date: new Date().toISOString(),
      total_amount: order.total_amount,
      status: 'Pending',
      payment_status: order.payment_status || 'Paid',
      delivery_method_id: deliveryMethodId,
    };

    console.log('Creating order:', orderData);

    // Note: Supabase doesn't support transactions in the client library.
    // For production, consider implementing a database function with BEGIN/COMMIT/ROLLBACK
    // or handling rollback manually if any step fails.

    // Insert order into database (using tu_order table)
    const { data: orderResult, error: orderError } = await supabase
      .from('tu_order')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { success: false, message: 'Failed to create order', error: orderError.message },
        { status: 500 }
      );
    }

    console.log('Order created:', orderResult);

    // Prepare order items for database
    // Note: This assumes you have the variant_id in your cart items
    // You may need to query the variant_id based on productId and option
    const orderItems = items.map((item: any) => ({
      order_id: orderResult.id,
      variant_id: item.variantId || item.productId, // Fallback to productId if variantId not available
      quantity: item.quantity,
      price_at_purchase: item.price,
      subtotal: item.price * item.quantity,
      sku_snapshot: item.sku || item.option || item.productName,
    }));

    console.log('Creating order items:', orderItems);

    // Insert order items (using tu_order_item table)
    const { data: itemsResult, error: itemsError } = await supabase
      .from('tu_order_item')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // Note: In production, you might want to rollback the order creation here
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create order items',
          error: itemsError.message,
        },
        { status: 500 }
      );
    }

    console.log('Order items created:', itemsResult);

    // Update inventory (decrease stock) using tu_inventory_stock
    const inventoryErrors = [];

    for (const item of items) {
      const variantId = item.variantId || item.productId;

      // Get current stock for atomic update
      const { data: stockData, error: stockFetchError } = await supabase
        .from('tu_inventory_stock')
        .select('id, quantity_available')
        .eq('variant_id', variantId)
        .eq('method_id', deliveryMethodId)
        .single();

      if (stockFetchError) {
        console.error(`Failed to fetch stock for variant ${variantId}:`, stockFetchError);
        inventoryErrors.push({
          variantId,
          error: 'Stock record not found',
          details: stockFetchError.message,
        });
        continue;
      }

      if (!stockData) {
        console.error(`No inventory record found for variant ${variantId} and delivery method ${deliveryMethodId}`);
        inventoryErrors.push({
          variantId,
          error: 'No inventory record found',
        });
        continue;
      }

      if (stockData.quantity_available < item.quantity) {
        console.warn(`Insufficient stock for variant ${variantId}. Available: ${stockData.quantity_available}, Requested: ${item.quantity}`);
        inventoryErrors.push({
          variantId,
          error: 'Insufficient stock',
          available: stockData.quantity_available,
          requested: item.quantity,
        });
        continue;
      }

      // Reduce inventory atomically
      const newQuantity = stockData.quantity_available - item.quantity;
      const { error: stockUpdateError } = await supabase
        .from('tu_inventory_stock')
        .update({ quantity_available: newQuantity })
        .eq('variant_id', variantId)
        .eq('method_id', deliveryMethodId)
        .eq('quantity_available', stockData.quantity_available); // Optimistic locking

      if (stockUpdateError) {
        console.error(`Failed to update stock for variant ${variantId}:`, stockUpdateError);
        inventoryErrors.push({
          variantId,
          error: 'Failed to update inventory',
          details: stockUpdateError.message,
        });
      } else {
        console.log(`Stock reduced for variant ${variantId}: ${stockData.quantity_available} -> ${newQuantity}`);
      }
    }

    // Return success with order ID and any inventory warnings
    return NextResponse.json({
      success: true,
      orderId: orderResult.id,
      message: 'Order created successfully',
      inventoryWarnings: inventoryErrors.length > 0 ? inventoryErrors : undefined,
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create order',
      },
      { status: 500 }
    );
  }
}
