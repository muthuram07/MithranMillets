import React, { createContext, useState, useEffect } from 'react';
import apiCart from '../services/apiCart';

export const CartContext = createContext({
  cart: [],
  addToCart: async () => {},
  increaseQty: async () => {},
  decreaseQty: async () => {},
  removeFromCartLocal: () => {},
  refreshCartFromServer: async () => {},
  clearLocalCart: () => {},
});

const mapServerToClient = (dto) => ({
  // server dto: { id, productId, productName, imageUrl, quantity, price }
  id: dto.productId ?? dto.id,
  cartItemId: dto.id,
  name: dto.productName,
  image: dto.imageUrl,
  qty: dto.quantity,
  price: dto.price,
});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from server on mount
  useEffect(() => {
    let mounted = true;
    apiCart.getCart()
      .then(res => {
        if (!mounted) return;
        const server = Array.isArray(res.data) ? res.data : [];
        const mapped = server.map(mapServerToClient);
        setCart(mapped);
      })
      .catch(err => {
        console.debug('Could not fetch server cart on load', err);
      });
    return () => { mounted = false; };
  }, []);

  const refreshCartFromServer = async () => {
    try {
      const res = await apiCart.getCart();
      const server = Array.isArray(res.data) ? res.data : [];
      setCart(server.map(mapServerToClient));
    } catch (err) {
      console.error('refreshCartFromServer failed', err);
    }
  };

  // Local helpers
  const upsertLocal = (item) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx === -1) return [...prev, item];
      const copy = [...prev];
      copy[idx] = item;
      return copy;
    });
  };

  const removeLocalByProductId = (productId) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  };

  // NEW: clear local cart immediately (UI only)
  const clearLocalCart = () => setCart([]);

  // Public actions

  const addToCart = async (product, quantity = 1) => {
    const productId = product.id ?? product.productId;
    if (!productId) {
      console.error('Invalid product id');
      return;
    }

    const existing = cart.find(i => i.id === productId);
    const optimistic = existing
      ? { ...existing, qty: existing.qty + quantity }
      : {
          id: productId,
          cartItemId: undefined,
          name: product.name ?? product.productName,
          image: product.image ?? product.imageUrl,
          qty: quantity,
          price: product.price,
        };
    upsertLocal(optimistic);

    try {
      const res = await apiCart.addItem(productId, optimistic.qty);
      await refreshCartFromServer();
      console.log('Added to cart');
      return res.data;
    } catch (err) {
      if (existing) {
        upsertLocal(existing);
      } else {
        removeLocalByProductId(productId);
      }
      console.error('addToCart failed', err);
      console.error('Failed to add item to cart');
      throw err;
    }
  };

  const increaseQty = async (clientItem) => {
    const productId = clientItem.id;
    const newQty = (clientItem.qty || 0) + 1;
    const optimistic = { ...clientItem, qty: newQty };
    upsertLocal(optimistic);

    try {
      const res = await apiCart.updateQuantity(productId, newQty);
      await refreshCartFromServer();
      console.log('Quantity updated');
      return res.data;
    } catch (err) {
      upsertLocal(clientItem);
      console.error('increaseQty failed', err);
      console.error('Failed to update quantity');
      throw err;
    }
  };

  const decreaseQty = async (clientItem) => {
    const productId = clientItem.id;
    const currentQty = clientItem.qty || 0;

    if (currentQty > 1) {
      const newQty = currentQty - 1;
      const optimistic = { ...clientItem, qty: newQty };
      upsertLocal(optimistic);

      try {
        const res = await apiCart.updateQuantity(productId, newQty);
        await refreshCartFromServer();
        console.log('Quantity updated');
        return res.data;
      } catch (err) {
        upsertLocal(clientItem);
        console.error('decreaseQty failed', err);
        console.error('Failed to update quantity');
        throw err;
      }
    } else {
      removeLocalByProductId(productId);
      try {
        if (clientItem.cartItemId) {
          await apiCart.removeById(clientItem.cartItemId);
        } else {
          await apiCart.updateQuantity(productId, 0);
        }
        await refreshCartFromServer();
        console.log('Item removed');
      } catch (err) {
        upsertLocal(clientItem);
        console.error('remove failed', err);
        console.error('Failed to remove item');
        throw err;
      }
    }
  };

  const removeFromCartLocal = (productId) => {
    removeLocalByProductId(productId);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      increaseQty,
      decreaseQty,
      removeFromCartLocal,
      refreshCartFromServer,
      clearLocalCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};
