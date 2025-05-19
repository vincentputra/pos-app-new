<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useCategories } from "@/composables/useCategories";

const { categories, isLoading, error, fetchCategories } = useCategories();

// Fetch categories when component mounts
onMounted(async () => {
  await fetchCategories();
});

const selectedCategory = ref(0);

const emit = defineEmits<{
  (e: "categoryChange", category: number): void;
}>();

const selectCategory = (categoryId: number) => {
  selectedCategory.value = categoryId;
  emit("categoryChange", categoryId);
};
</script>

<template>
  <div class="mb-6">
    <div class="flex flex-wrap gap-3 pb-2 pt-4">
      <template v-if="isLoading">
        <div
          v-for="n in 5"
          :key="n"
          class="h-9 w-24 animate-pulse rounded-lg bg-gray-200"
        ></div>
      </template>

      <template v-else>
        <Button
          v-for="category in categories"
          :key="category.id"
          :variant="selectedCategory === category.id ? 'default' : 'outline'"
          class="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-white"
          :class="
            selectedCategory === category.id
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'hover:bg-gray-50'
          "
          @click="selectCategory(category.id)"
        >
          <span>{{ category.name }}</span>
        </Button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin: 0 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #cbd5e1;
}
</style>
