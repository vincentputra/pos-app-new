<template>
  <div class="mb-2 w-full">
    <div class="relative">
      <Search
        class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        placeholder="Search for products..."
        class="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        v-model="searchQuery"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from "lucide-vue-next";

const searchQuery = ref("");
</script>
