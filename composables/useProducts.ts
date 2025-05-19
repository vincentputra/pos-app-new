import { ref } from "vue";
import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: [
    {
      id: number;
      name: string;
    }
  ];
  quantity: number;
};

export const useProducts = () => {
  const products = ref<Product[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const storage = useStorage();
  const config = useRuntimeConfig();

  const fetchProducts = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const storedToken = storage.getItem("auth_token");
      if (!storedToken) throw new Error("No auth token found");

      let tokenData: { value: string; expiresAt: number };
      try {
        tokenData = JSON.parse(storedToken);
      } catch {
        throw new Error("Invalid token format");
      }

      const response = await useFetch<{ data: Product[] }>(
        `${config.public.apiBase}/products`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.data.value?.data) {
        throw new Error("No data received from API");
      }

      products.value = response.data.value.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch products";
      console.error("Error fetching products:", e);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    products,
    isLoading,
    error,
    fetchProducts,
  };
};
