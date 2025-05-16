import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";
import { useAuth } from "@/composables/useAuth";
//import { useHistory } from '@/composables/useHistory';

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return;
  //const { addRoute } = useHistory();
  const { isAuthenticated, initAuth } = await useAuth();

  // Don't track login page in history
  //if (from.path !== '/login' && to.path !== '/') {
  // Add the current route to history before proceeding
  //addRoute(from.fullPath);
  //}

  // Initialize auth state
  await initAuth();

  if (!isAuthenticated.value && to.path !== "/login") {
    abortNavigation();
    return navigateTo("/login");
  } else if (isAuthenticated.value && to.path === "/login") {
    return navigateTo("/");
  }
});
