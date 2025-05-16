import { ref, computed } from "vue";
import { defineStore } from "pinia";

type CartItem = {
  id: number;
  name: string;
  image: string;
  description: string;
  price: number;
  quantity: number;
};

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>([]);

  const addItem = (product: CartItem) => {
    const existingItem = items.value.find((item) => item.id === product.id);
    const numericPrice =
      typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price;

    if (existingItem) {
      existingItem.quantity++;
    } else {
      items.value.push({
        ...product,
        price: numericPrice,
        quantity: 1,
      });
    }
  };

  const removeItem = (productId: number) => {
    items.value = items.value.filter((item) => item.id !== productId);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const item = items.value.find((item) => item.id === productId);
    if (item) {
      item.quantity = quantity;
      if (quantity <= 0) {
        removeItem(productId);
      }
    }
  };

  const subtotal = computed(() => {
    return items.value.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  });

  const reset = () => {
    items.value = [];
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    subtotal,
    reset,
  };
});
