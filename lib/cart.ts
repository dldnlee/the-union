export type DeliveryMethod = "팬미팅현장수령" | "국내배송" | "해외배송";

export type CartItem = {
  productId: string;
  productName: string;
  option?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  deliveryMethod?: DeliveryMethod;
};

const CART_STORAGE_KEY = 'shopping_cart';

// Get cart from localStorage (client-side only)
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
    return [];
  }
}

// Save cart to localStorage
export function saveCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}

// Add item to cart
export function addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }): void {
  const cart = getCart();
  const existingItemIndex = cart.findIndex(
    (cartItem) =>
      cartItem.productId === item.productId &&
      cartItem.option === item.option
  );

  if (existingItemIndex > -1) {
    // Update quantity if item already exists
    cart[existingItemIndex].quantity += item.quantity || 1;
  } else {
    // Add new item
    cart.push({
      ...item,
      quantity: item.quantity || 1,
    });
  }

  saveCart(cart);
}

// Remove item from cart
export function removeFromCart(productId: string, option?: string): void {
  const cart = getCart();
  const updatedCart = cart.filter(
    (item) => !(item.productId === productId && item.option === option)
  );
  saveCart(updatedCart);
}

// Update item quantity
export function updateCartItemQuantity(
  productId: string,
  quantity: number,
  option?: string
): void {
  const cart = getCart();
  const itemIndex = cart.findIndex(
    (item) => item.productId === productId && item.option === option
  );

  if (itemIndex > -1) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].quantity = quantity;
    }
    saveCart(cart);
  }
}

// Update delivery method for all cart items
export function updateCartDeliveryMethod(deliveryMethod: DeliveryMethod): void {
  const cart = getCart();
  const updatedCart = cart.map(item => ({
    ...item,
    deliveryMethod
  }));
  saveCart(updatedCart);
}

// Clear cart
export function clearCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
}

// Get cart total
export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// Get cart item count
export function getCartItemCount(): number {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
}
