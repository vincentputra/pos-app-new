import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";
import { useAuth } from "@/composables/useAuth";
//import { useHistory } from '@/composables/useHistory';

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return;
  //const { addRoute } = useHistory();
  const { user, isAuthenticated, initAuth } = useAuth();

  // Don't track login page in history
  //if (from.path !== '/login' && to.path !== '/') {
  // Add the current route to history before proceeding
  //addRoute(from.fullPath);
  //}

  // Initialize auth state
  await initAuth();

  const adminRoutes = [
    "/sales-report",
    "/transactions-report",
    "/shifts-report",
    "/discounts",
    "/product-inventory",
    "/inventory-summary",
    "/inventory-adjustment",
    "/employees",
  ];

  if (user.value?.role === 1 && adminRoutes.includes(to.path)) {
    return abortNavigation(
      showError({
        statusCode: 404,
        statusMessage: "Page Not Found",
      })
    );
  }

  if (!isAuthenticated.value && to.path !== "/login") {
    abortNavigation();
    return navigateTo("/login");
  } else if (isAuthenticated.value && to.path === "/login") {
    return navigateTo("/");
  }
});
