<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner";
</script>

<template>
  <div class="h-screen">
    <Toaster />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
