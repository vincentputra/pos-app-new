import { ref } from "vue";
import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";

type Discount = {
  id: number;
  name: string;
  description: string;
  type: number;
  amount: number;
  status: number;
};

type Status = {
  id: number;
  name: string;
};

type Type = {
  id: number;
  name: string;
};

type Page = {
  page: number;
  per_page: number;
  status?: number;
  type?: number;
  search?: string;
};

export const useDiscounts = () => {
  const discounts = ref<Discount[]>([]);
  const pageDiscount = ref<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const storage = useStorage();
  const config = useRuntimeConfig();
  const statusDiscount = ref<Status[]>([
    {
      id: 0,
      name: "Active",
    },
    {
      id: 1,
      name: "Disabled",
    },
    {
      id: 2,
      name: "Deleted",
    },
  ]);
  const typeDiscount = ref<Type[]>([
    {
      id: 1,
      name: "Fixed",
    },
    {
      id: 2,
      name: "Percentage",
    },
  ]);

  const fetchDiscounts = async (payload: Page) => {
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

      let parameter = `page=${payload.page}&per_page=${payload.per_page}`;
      if (
        payload.status !== undefined &&
        payload.status !== null &&
        Number(payload.status) !== 3
      ) {
        parameter = parameter + `&status=${payload.status}`;
      }
      if (
        payload.type !== undefined &&
        payload.type !== null &&
        Number(payload.type) !== 0
      ) {
        parameter = parameter + `&type=${payload.type}`;
      }
      if (
        payload.search !== undefined &&
        payload.search !== null &&
        payload.search !== ""
      ) {
        parameter = parameter + `&search=${payload.search}`;
      }
      const { data, error } = await useFetch<{
        data: Discount[];
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      }>(`${config.public.apiBase}/discounts?${parameter}`, {
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
        },
      });

      if (error.value) {
        throw new Error(
          error.value.data.message || "Failed to fetch discounts"
        );
      }

      if (!data.value?.data) {
        throw new Error("No data received from API");
      }

      discounts.value = data.value.data;
      pageDiscount.value = data.value.meta;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch discounts";
      throw new Error(error.value);
      //console.error("Error fetching products:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const createDiscount = async (payload: any) => {
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

      const { data, error } = await useFetch(
        `${config.public.apiBase}/discounts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
          },
          body: payload,
        }
      );

      if (error.value) {
        throw new Error(
          error.value.data.message || "Failed to create discount"
        );
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      return data.value;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to create discount";
      throw new Error(error.value);
    } finally {
      isLoading.value = false;
    }
  };

  const updateDiscount = async (payload: any) => {
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

      const { data, error } = await useFetch(
        `${config.public.apiBase}/discounts/${payload.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
          },
          body: payload,
        }
      );

      if (error.value) {
        throw new Error(
          error.value.data.message || "Failed to update discount"
        );
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      return data.value;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to update discount";
      throw new Error(error.value);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteDiscount = async (payload: any) => {
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

      const { data, error } = await useFetch(
        `${config.public.apiBase}/discounts/${payload.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (error.value) {
        throw new Error(
          error.value.data.message || "Failed to delete discount"
        );
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      return data.value;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete discount";
      throw new Error(error.value);
      //console.error("Error deleting user:", e);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    discounts,
    pageDiscount,
    statusDiscount,
    typeDiscount,
    isLoading,
    error,
    fetchDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
  };
};
