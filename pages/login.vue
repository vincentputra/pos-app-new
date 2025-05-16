<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useAuth } from "@/composables/useAuth";
import { navigateTo } from "nuxt/app";

const { login } = useAuth();

const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");
const hasError = ref(false);

const handleLogin = async () => {
  try {
    errorMessage.value = "";
    hasError.value = false;
    isLoading.value = true;
    await login(email.value, password.value, rememberMe.value);
    return navigateTo("/");
  } catch (error) {
    hasError.value = true;
    errorMessage.value =
      error instanceof Error ? error.message : "Login failed";
    toast.error(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
};

// Use watchEffect for navigation after auth state changes
/* watchEffect(() => {
  if (isAuthenticated.value) {
    return navigateTo("/");
  }
}); */

definePageMeta({
  layout: "default",
  middleware: ["auth"],
});
</script>

<template>
  <div class="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
    <div class="flex items-center justify-center py-12">
      <div class="mx-auto grid w-[350px] gap-6">
        <div class="grid gap-2 text-center">
          <h1 class="text-3xl font-bold">Login</h1>
          <p class="text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <div class="grid gap-4">
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                :class="{ 'border-red-500': hasError }"
                placeholder="Enter your email"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="password">Password</Label>
              <Input
                id="password"
                v-model="password"
                type="password"
                :class="{ 'border-red-500': hasError }"
                placeholder="Enter your password"
                required
              />
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox id="remember" v-model="rememberMe" />
              <label
                for="remember"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>
            <div v-if="errorMessage" class="mt-2 text-sm text-red-600">
              {{ errorMessage }}
            </div>
            <Button type="submit" class="w-full" :disabled="isLoading">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ isLoading ? "logging in..." : "Login" }}
            </Button>
          </form>
        </div>
      </div>
    </div>
    <div class="hidden bg-muted lg:block">
      <img
        src="/assets/images/placeholder.svg"
        alt="Image"
        width="1920"
        height="1080"
        class="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
  </div>
</template>
