import { ref } from "vue";
import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: number;
  password: string;
};

type Role = {
  id: number;
  name: string;
};

type Page = {
  page: number;
  per_page: number;
};

export const useUsers = () => {
  const users = ref<User[]>([]);
  const usersByRole = ref<User[]>([]);
  const pageUser = ref<{
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

  const fetchUsers = async (payload: Page) => {
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
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      }>(
        `${config.public.apiBase}/users?page=${payload.page}&per_page=${payload.per_page}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
          },
        }
      );

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to fetch users");
      }

      if (!data.value?.data) {
        throw new Error("No data received from API");
      }

      users.value = data.value.data;
      pageUser.value = data.value.meta;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch users";
      throw new Error(error.value);
      // error.value == "Unauthenticated."
      //console.error("Error fetching users:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const createUser = async (payload: any) => {
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

      const { data, error } = await useFetch(`${config.public.apiBase}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: payload,
      });

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to create user");
      }

      if (!data.value) {
        throw new Error("No response data received");
      }

      return data.value;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to create user";
      throw new Error(error.value);
      //console.error("Error creating user:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const updateUser = async (payload: any) => {
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
        `${config.public.apiBase}/users/${payload.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: payload,
        }
      );

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to update user");
      }

      if (!data.value) {
        throw new Error("No response data received");
      }

      return data.value;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to update user";
      throw new Error(error.value);
      //console.error("Error updating user:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteUser = async (payload: any) => {
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
        `${config.public.apiBase}/users/${payload.id}`,
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

  const fetchUsersByRole = async (role: number) => {
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
      }>(`${config.public.apiBase}/users/role/${role}`, {
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
        },
      });

      if (error.value) {
        throw new Error(
          error.value.data.message || "Failed to fetch users by role"
        );
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      usersByRole.value = data.value.data;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch users by role";
      throw new Error(error.value);
      //console.error("Error fetching users by role:", e);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    users,
    pageUser,
    usersByRole,
    roles,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchUsersByRole,
  };
};
