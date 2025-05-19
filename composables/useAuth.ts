import { ref } from "vue";
import { navigateTo, useRuntimeConfig } from "nuxt/app";
import { useCartStore } from "@/stores/useCartStore";
import { useStorage } from "@/composables/useStorage";
//import { clearHistory } from '@/composables/useHistory';

type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: number;
  };
};

type StoredToken = {
  value: string;
  expiresAt: number;
};

export const useAuth = () => {
  const storage = useStorage();
  const isAuthenticated = ref(false);
  const user = ref<LoginResponse["user"] | null>(null);
  const cartStore = useCartStore();

  const setToken = (token: string, rememberMe: boolean = false) => {
    const expiresAt =
      Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
    const tokenData: StoredToken = {
      value: token,
      expiresAt,
    };
    storage.setItem("auth_token", JSON.stringify(tokenData));
  };

  const getToken = async () => {
    const storedToken = storage.getItem("auth_token");
    if (!storedToken) return null;

    try {
      const tokenData: StoredToken = JSON.parse(storedToken);
      if (Date.now() > tokenData.expiresAt) {
        storage.removeItem("auth_token");
        storage.removeItem("user");
        return null;
      }
      return tokenData.value;
    } catch {
      storage.removeItem("auth_token");
      return null;
    }
  };

  const initAuth = async () => {
    const token = await getToken();
    const storedUser = storage.getItem("user");
    //console.log("initAuth", token, storedUser, isAuthenticated.value);

    isAuthenticated.value = !!token;

    if (!token || !storedUser) {
      storage.removeItem("auth_token");
      storage.removeItem("user");
      user.value = null;
      isAuthenticated.value = false;
      return;
    }

    if (storedUser && storedUser !== "undefined") {
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        console.error("Failed to parse stored user:", e);

        storage.removeItem("auth_token");
        storage.removeItem("user");
        user.value = null;
        isAuthenticated.value = false;
      }
    }
    return;
  };

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    const config = useRuntimeConfig();
    try {
      const response = await fetch(`${config.public.apiBase}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      setToken(data.token, rememberMe);
      storage.setItem("user", JSON.stringify(data.user));
      user.value = data.user;
      isAuthenticated.value = true;
      return true;
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          "Unable to connect to the server. Please check your internet connection."
        );
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear all auth-related storage
      storage.removeItem("auth_token");
      storage.removeItem("user");
      //clearHistory()
      user.value = null;
      isAuthenticated.value = false;

      // Reset cart store
      cartStore.reset();

      // Navigate to login using navigateTo for better Nuxt integration
      return navigateTo("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return {
    login,
    logout,
    isAuthenticated,
    user,
    initAuth,
  };
};
