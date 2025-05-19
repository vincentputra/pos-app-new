import { ref } from "vue";
import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";

type Category = {
  id: number;
  name: string;
};

export const useCategories = () => {
  const categories = ref<Category[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const storage = useStorage();
  const config = useRuntimeConfig();

  const fetchCategories = async () => {
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

      const response = await useFetch<{ data: Category[] }>(
        `${config.public.apiBase}/product-categories`,
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

      // Add default "All" category and update the ref
      categories.value = [{ id: 0, name: "All" }, ...response.data.value.data];
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch categories";
      console.error("Error fetching categories:", e);
      // Initialize with at least the "All" category on error
      categories.value = [{ id: 0, name: "All" }];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
  };
};
