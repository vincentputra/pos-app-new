import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { toast } from "vue-sonner";

type CartItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
  total_stock: number;
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
      if (existingItem.quantity + 1 <= product.total_stock) {
        existingItem.quantity++;
      } else {
        toast.error("Quantity cannot be greater than total stock");
        return {
          message: "Quantity cannot be greater than total stock",
          status: "error",
        };
      }
    } else {
      items.value.push({
        ...product,
        price: numericPrice,
        quantity: 1,
      });
    }
    toast.success("Product added to cart");
    return {
      message: "Product added to cart",
      status: "success",
    };
  };

  const removeItem = (productId: number) => {
    items.value = items.value.filter((item) => item.id !== productId);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const item = items.value.find((item) => item.id === productId);
    if (item) {
      if (quantity <= Number(item.total_stock)) {
        item.quantity = quantity;
      } else {
        toast.error("Quantity cannot be greater than total stock");
        return {
          message: "Quantity cannot be greater than total stock",
          status: "error",
        };
      }
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
