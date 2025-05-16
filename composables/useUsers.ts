import { ref } from "vue";
import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";

type User = {
  id: number;
  name: string;
  email: string;
  role: number;
};

type Role = {
  id: number;
  name: string;
};

export const useUsers = () => {
  const users = ref<User[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const storage = useStorage();
  const config = useRuntimeConfig();
  const roles = ref<Role[]>([
    {
      id: 0,
      name: "Admin",
    },
    {
      id: 1,
      name: "Cashier",
    },
  ]);

  const fetchUsers = async () => {
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

      const { data, error } = await useFetch<{
        data: User[];
      }>(`${config.public.apiBase}/users`, {
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
        },
        lazy: true,
        server: false,
      });

      if (error.value) {
        throw new Error(error.value.message || "Failed to fetch users");
      }

      if (!data.value?.data) {
        throw new Error("No data received from API");
      }

      users.value = data.value.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch users";
      console.error("Error fetching users:", e);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    users,
    roles,
    isLoading,
    error,
    fetchUsers,
  };
};
