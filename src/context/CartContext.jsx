import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getPrimaryProductImageUrl } from '../utils/imageHelper';
import { CartContext } from './useCart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem('cart') || localStorage.getItem('cartItems');
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('CartContext: Failed to parse cart items from localStorage', e);
    }
    return [];
  });

  // Derived state — delivery charge applies ONCE per distinct product line (NOT multiplied by quantity)
  const { safeCartItems, cartItemCount, cartSubtotal, cartTax, cartShipping, cartTotal } = useMemo(() => {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    const tax = Math.round(subtotal * 0.18); // Included GST amount for information

    // Sum delivery charge once per distinct cart line
    const shipping = items.reduce((acc, item) => {
      const charge = item.deliveryCharge !== undefined && item.deliveryCharge !== null
        ? Number(item.deliveryCharge)
        : 49;
      return acc + (isNaN(charge) || charge < 0 ? 49 : charge);
    }, 0);

    return {
      safeCartItems: items,
      cartItemCount: items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0),
      cartSubtotal: subtotal,
      cartTax: tax,
      cartShipping: shipping,
      cartTotal: subtotal + shipping,
    };
  }, [cartItems]);

  const saveCartToStorage = useCallback((items) => {
    const safeItems = Array.isArray(items) ? items : [];
    try {
      localStorage.setItem('cart', JSON.stringify(safeItems));
      localStorage.setItem('cartItems', JSON.stringify(safeItems));
    } catch (e) {
      console.error('CartContext: Failed to save cart items to localStorage', e);
    }
    setCartItems(safeItems);
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    if (!product) {
      console.error('CartContext: Cannot add to cart, product is null or undefined');
      toast.error('Failed to add to cart: Invalid product');
      return;
    }

    const productId = product._id || product.id;
    if (!productId) {
      console.error('CartContext: Cannot add to cart, product has no valid ID:', product);
      toast.error('Failed to add to cart: Product has no ID');
      return;
    }

    const productName = product.name || 'Product';
    const productImage = getPrimaryProductImageUrl(product);
    const productPrice = product.offerPrice || product.offer || product.price || 0;
    const productStock = product.stock !== undefined ? product.stock : 99;

    // Parse delivery charge
    let deliveryCharge = 49;
    if (product.deliveryCharge !== undefined && product.deliveryCharge !== null) {
      deliveryCharge = Number(product.deliveryCharge);
    } else if (product.delivery_charge !== undefined && product.delivery_charge !== null) {
      deliveryCharge = Number(product.delivery_charge);
    }
    if (isNaN(deliveryCharge) || deliveryCharge < 0) deliveryCharge = 49;

    const existItem = cartItems.find((x) => (x.product || x.id) === productId);
    let updatedCart;

    if (existItem) {
      const newQuantity = (existItem.quantity || 1) + quantity;

      if (newQuantity > productStock) {
        toast.error(`Sorry, only ${productStock} items in stock`);
        return;
      }

      updatedCart = cartItems.map((x) =>
        (x.product || x.id) === productId
          ? {
              ...x,
              quantity: newQuantity,
              image: productImage || x.image,
              deliveryCharge,
            }
          : x
      );
    } else {
      if (quantity > productStock) {
        toast.error(`Sorry, only ${productStock} items in stock`);
        return;
      }

      updatedCart = [
        ...cartItems,
        {
          product: productId,
          name: productName,
          brand: product.brand || '',
          image: productImage,
          price: productPrice,
          deliveryCharge,
          stock: productStock,
          quantity,
        },
      ];
    }

    saveCartToStorage(updatedCart);
    toast.success(`${productName} added to cart!`);
  }, [cartItems, saveCartToStorage]);

  const removeFromCart = useCallback((productId) => {
    const updatedCart = cartItems.filter((x) => (x.product || x.id) !== productId);
    saveCartToStorage(updatedCart);
    toast.success('Item removed from cart');
  }, [cartItems, saveCartToStorage]);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cartItems.map((item) => {
      if ((item.product || item.id) === productId) {
        if (quantity > item.stock) {
          toast.error(`Sorry, only ${item.stock} items in stock`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    });

    saveCartToStorage(updatedCart);
  }, [cartItems, saveCartToStorage, removeFromCart]);

  const clearCart = useCallback(() => {
    saveCartToStorage([]);
  }, [saveCartToStorage]);

  const clearPurchasedItems = useCallback((purchasedProductIds) => {
    if (!Array.isArray(purchasedProductIds) || purchasedProductIds.length === 0) {
      saveCartToStorage([]);
      return;
    }
    const idSet = new Set(purchasedProductIds.map(id => String(id)));
    const remainingItems = cartItems.filter((x) => !idSet.has(String(x.product || x.id)));
    saveCartToStorage(remainingItems);
  }, [cartItems, saveCartToStorage]);

  const value = useMemo(() => ({
    cartItems: safeCartItems,
    cartItemCount,
    cartSubtotal,
    cartTax,
    cartShipping,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearPurchasedItems,
  }), [safeCartItems, cartItemCount, cartSubtotal, cartTax, cartShipping, cartTotal, addToCart, updateQuantity, removeFromCart, clearCart, clearPurchasedItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
