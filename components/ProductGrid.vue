<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/useCartStore";
import { useProducts } from "@/composables/useProducts";
import ProductCategories from "@/components/ProductCategories.vue";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: [
    {
      id: number;
      name: string;
    }
  ];
  quantity: number;
};

const cartStore = useCartStore();
const selectedCategory = ref(0);
const { products, isLoading, error, fetchProducts } = useProducts();

// Fetch products when component mounts
onMounted(async () => {
  await fetchProducts();
});

const filteredProducts = computed(() => {
  /* if (selectedCategory.value === 0) {
    return products.value;
  }
  return products.value.filter(
    (product) => product.category.id === selectedCategory.value
  ); */
  return products.value;
});

const filterByCategory = (category: number) => {
  selectedCategory.value = category;
};

const addToCart = (product: any) => {
  cartStore.addItem(product);
};

const formatPrice = (price: number | string): string => {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  return !isNaN(numericPrice) ? numericPrice.toFixed(2) : "0.00";
};
</script>

<template>
  <div class="custom-scrollbar flex min-h-0 flex-1 flex-col p-6">
    <div class="flex-none">
      <SearchHeader />
    </div>
    <div class="flex-none">
      <ProductCategories @categoryChange="filterByCategory" />
    </div>

    <div class="flex-1">
      <div
        class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        <template v-if="isLoading">
          <ProductCardSkeleton v-for="n in 8" :key="n" />
        </template>

        <template v-else>
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="flex flex-col rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-lg"
          >
            <img
              :src="product.image"
              :alt="product.name"
              class="mb-4 aspect-square w-full rounded-lg object-cover"
            />
            <div class="flex flex-1 flex-col">
              <h3 class="font-medium text-gray-800">{{ product.name }}</h3>
              <p class="mb-3 text-sm text-gray-600">
                {{ product.description }}
              </p>
              <div
                class="mt-auto grid grid-cols-1 flex-wrap items-center justify-between lg:grid-cols-2"
              >
                <span class="font-bold text-gray-900 lg:grid-cols-2"
                  >${{ formatPrice(product.price) }}</span
                >
                <Button @click="addToCart(product)">Add to Cart</Button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
  overflow-y: auto;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #cbd5e1;
}
</style>
