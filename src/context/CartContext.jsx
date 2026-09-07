import { createContext, useState, useContext, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { SHIPPING_THRESHOLD, SHIPPING_CHARGE } from '../utils/constants';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

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

  // Derived state — recomputed only when cartItems actually changes
  const { safeCartItems, cartItemCount, cartSubtotal, cartTax, cartShipping, cartTotal } = useMemo(() => {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18); // Included GST amount for information
    const shipping = items.length === 0 || subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
    return {
      safeCartItems: items,
      cartItemCount: items.reduce((acc, item) => acc + item.quantity, 0),
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
    const productImage = product.images?.[0]?.url || product.image || '';
    const productPrice = product.offerPrice || product.offer || product.price || 0;
    const productStock = product.stock !== undefined ? product.stock : 99;

    const existItem = cartItems.find((x) => x.product === productId);
    let updatedCart;
    
    if (existItem) {
      const newQuantity = existItem.quantity + quantity;
      
      if (newQuantity > productStock) {
        toast.error(`Sorry, only ${productStock} items in stock`);
        return;
      }
      
      updatedCart = cartItems.map((x) =>
        x.product === existItem.product ? { ...x, quantity: newQuantity } : x
      );
    } else {
      if (quantity > productStock) {
        toast.error(`Sorry, only ${productStock} items in stock`);
        return;
      }
      
      updatedCart = [...cartItems, {
        product: productId,
        name: productName,
        brand: product.brand || '',
        image: productImage,
        price: productPrice,
        stock: productStock,
        quantity,
      }];
    }
    
    saveCartToStorage(updatedCart);
    toast.success(`${productName} added to cart!`);
  }, [cartItems, saveCartToStorage]);

  const removeFromCart = useCallback((productId) => {
    const updatedCart = cartItems.filter((x) => x.product !== productId);
    saveCartToStorage(updatedCart);
    toast.success('Item removed from cart');
  }, [cartItems, saveCartToStorage]);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cartItems.map((item) => {
      if (item.product === productId) {
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
  }), [safeCartItems, cartItemCount, cartSubtotal, cartTax, cartShipping, cartTotal, addToCart, updateQuantity, removeFromCart, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
