<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
</script>

<template>
  <div class="flex flex-col">
    <!-- rounded-lg p-4 shadow transition-shadow hover:shadow-lg  -->
    <Skeleton class="mb-4 aspect-square w-full rounded-lg" />
    <div class="space-y-3">
      <Skeleton class="h-4 w-3/4 rounded" />
      <Skeleton class="h-4 w-full rounded" />
      <Skeleton class="h-3 w-full rounded" />
      <Skeleton class="mt-4 h-9 w-full rounded" />
    </div>
  </div>
</template>
