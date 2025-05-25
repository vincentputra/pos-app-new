import { ref } from "vue";
import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  status: number;
  total_stock: number;
};

type Status = {
  id: number;
  name: string;
};

type Stock = {
  id: number;
  product_id: number;
  user_id: number;
  quantity: number;
  created_at: string;
  product: {
    id: number;
    name: string;
    image: string;
    description: string;
    price: number;
    status: number;
  };
  user: {
    id: number;
    name: string;
  };
};

type Adjustment = {
  id: number;
  product_id: number;
  user_id: number;
  stock_id: number;
  type: number;
  quantity: number;
  note: string;
  image: string;
  created_at: string;
  product: {
    id: number;
    name: string;
    image: string;
    description: string;
    price: number;
    status: number;
  };
  user: {
    id: number;
    name: string;
  };
};

type Page = {
  page: number;
  per_page: number;
  status?: number;
  user_id?: number;
  product_id?: number;
  stock_id?: number;
  type?: number;
  search?: string;
  stock?: number;
};

export const useProducts = () => {
  const products = ref<Product[]>([]);
  const adjustmentProducts = ref<Adjustment[]>([]);
  const pageProduct = ref<{
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
  const statusProduct = ref<Status[]>([
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
  const statusStock = ref<Status[]>([
    {
      id: 0,
      name: "Adding Stock",
    },
    {
      id: 1,
      name: "Minus Stock",
    },
  ]);

  const fetchProducts = async (payload: Page) => {
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
      if (payload.status !== undefined && payload.status !== null) {
        parameter = parameter + `&status=${payload.status}`;
      }
      if (
        payload.user_id !== undefined &&
        payload.user_id !== null &&
        Number(payload.user_id) !== 0
      ) {
        parameter = parameter + `&user_id=${payload.user_id}`;
      }
      if (
        payload.search !== undefined &&
        payload.search !== null &&
        payload.search !== ""
      ) {
        parameter = parameter + `&search=${payload.search}`;
      }
      if (
        payload.stock !== undefined &&
        payload.stock !== null &&
        Number(payload.stock) !== 0
      ) {
        parameter = parameter + `&stock=${payload.user_id}`;
      }
      const { data, error } = await useFetch<{
        data: Product[];
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      }>(`${config.public.apiBase}/products?${parameter}`, {
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
        },
      });

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to fetch users");
      }

      if (!data.value?.data) {
        throw new Error("No data received from API");
      }

      products.value = data.value.data;
      pageProduct.value = data.value.meta;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch products";
      throw new Error(error.value);
      //console.error("Error fetching products:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const uploadImageAdjustment = async (payload: any) => {
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

      const formData = new FormData();
      if (payload instanceof File) {
        formData.append("image", payload);
      }

      const { data, error } = await useFetch(
        `${config.public.apiBase}/adjustment-products/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to upload image");
      }

      if (!data.value) {
        throw new Error("No response data received");
      }

      return data.value;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to upload image";
      throw new Error(error.value);
    } finally {
      isLoading.value = false;
    }
  };

  const updateStock = async (payload: any, page: Page) => {
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

      const dataStock = await useFetch<{
        data: Stock[];
      }>(
        `${config.public.apiBase}/stock-products?product_id=${payload.product_id}&user_id=${payload.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
          },
        }
      );

      if (dataStock.data.value?.data[0]) {
        // Update stock product if it exists
        const { data, error } = await useFetch(
          `${config.public.apiBase}/stock-products/${dataStock.data.value.data[0].id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${tokenData.value}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: payload,
          }
        );

        if (error.value) {
          throw new Error(
            error.value.data.message || "Failed to update stock product"
          );
        }

        if (!data.value) {
          throw new Error("No response data received");
        }
      } else {
        // Create new stock product if it doesn't exist
        const { data, error } = await useFetch(
          `${config.public.apiBase}/stock-products`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenData.value}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: payload,
          }
        );

        if (error.value) {
          throw new Error(
            error.value.data.message || "Failed to create stock product"
          );
        }

        if (!data.value) {
          throw new Error("No response data received");
        }
      }

      await fetchProducts(page);
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to update stock product";
      throw new Error(error.value);
      //console.error("Error updating stock product:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchAdjustmentProducts = async (payload: Page) => {
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
        payload.product_id !== undefined &&
        payload.product_id !== null &&
        Number(payload.product_id) !== 0
      ) {
        parameter = parameter + `&product_id=${payload.product_id}`;
      }
      if (
        payload.user_id !== undefined &&
        payload.user_id !== null &&
        Number(payload.user_id) !== 0
      ) {
        parameter = parameter + `&user_id=${payload.user_id}`;
      }
      if (
        payload.stock_id !== undefined &&
        payload.stock_id !== null &&
        Number(payload.stock_id) !== 0
      ) {
        parameter = parameter + `&stock_id=${payload.stock_id}`;
      }
      const { data, error } = await useFetch<{
        data: Adjustment[];
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      }>(`${config.public.apiBase}/adjustment-products?${parameter}`, {
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
        },
      });

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to fetch users");
      }

      if (!data.value?.data) {
        throw new Error("No data received from API");
      }

      adjustmentProducts.value = data.value.data;
      pageProduct.value = data.value.meta;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch products";
      throw new Error(error.value);
      //console.error("Error fetching products:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const createProduct = async (payload: any) => {
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

      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("description", payload.description);
      formData.append("price", payload.price);
      formData.append("status", payload.status);

      if (payload.image instanceof File) {
        formData.append("image", payload.image);
      }

      const { data, error } = await useFetch(
        `${config.public.apiBase}/products`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to create product");
      }

      if (!data.value) {
        throw new Error("No response data received");
      }

      return data.value;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to create product";
      throw new Error(error.value);
    } finally {
      isLoading.value = false;
    }
  };

  const updateProduct = async (payload: any) => {
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

      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("description", payload.description);
      formData.append("price", payload.price);
      formData.append("status", payload.status);

      if (payload.image instanceof File) {
        formData.append("image", payload.image);
      }

      const { data, error } = await useFetch(
        `${config.public.apiBase}/products/${payload.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to update product");
      }

      if (!data.value) {
        throw new Error("No response data received");
      }

      return data.value;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to update product";
      throw new Error(error.value);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteProduct = async (payload: any) => {
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
        `${config.public.apiBase}/products/${payload.id}`,
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
        throw new Error(error.value.data.message || "Failed to delete user");
      }

      if (!data.value) {
        throw new Error("No response data received");
      }

      return data.value;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to delete user";
      throw new Error(error.value);
      //console.error("Error deleting user:", e);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    products,
    pageProduct,
    statusProduct,
    statusStock,
    adjustmentProducts,
    isLoading,
    error,
    fetchProducts,
    uploadImageAdjustment,
    updateStock,
    fetchAdjustmentProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
