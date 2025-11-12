import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Orders Creation API
 *
 * Creates an order in the database after successful payment verification.
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

    // Map delivery method name to ID
    // You'll need to query this from your delivery_method table or have a mapping
    const deliveryMethodMap: Record<string, string> = {
      '팬미팅현장수령': 'onsite',
      '국내배송': 'domestic',
      '해외배송': 'international',
    };

    const deliveryMethodId = deliveryMethodMap[order.delivery_method] || 'onsite';

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

    // Insert order into database
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
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
      sku_snapshop: item.option || item.productName,
    }));

    console.log('Creating order items:', orderItems);

    // Insert order items
    const { data: itemsResult, error: itemsError } = await supabase
      .from('order_items')
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

    // Update inventory (decrease stock)
    // Note: You'll need to implement inventory reduction logic based on your business rules
    // This is a placeholder - you should update inventory_stock table
    for (const item of items) {
      // TODO: Implement inventory reduction
      // Example:
      // await supabase
      //   .from('inventory_stock')
      //   .update({ quantity_available: supabase.rpc('decrement', { amount: item.quantity }) })
      //   .eq('variant_id', item.variantId)
      //   .eq('method_id', deliveryMethodId);
    }

    // Return success with order ID
    return NextResponse.json({
      success: true,
      orderId: orderResult.id,
      message: 'Order created successfully',
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
