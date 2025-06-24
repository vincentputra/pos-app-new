<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { useDebounceFn } from "@vueuse/core";

const text = ref("");
const emit = defineEmits<{
  (e: "search-filter", search: string): void;
}>();

const debouncedWatch = useDebounceFn((value) => {
  emit("search-filter", value);
}, 300);

watch(text, (newValue) => {
  debouncedWatch(newValue);
});
</script>

<template>
  <Input class="max-w-sm mb-4" v-model="text" placeholder="Search" />
</template>
