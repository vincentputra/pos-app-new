<script setup lang="ts">
definePageMeta({
  layout: "authenticated",
  middleware: ["auth"],
});
</script>

<template>
  <ProductGrid class="h-screen flex-shrink-0" />
  <CartSidebar class="h-screen flex-shrink-0" />
</template>
