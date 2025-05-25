<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/composables/useAuth";
import { useProducts } from "@/composables/useProducts";
import { useCartStore } from "@/stores/useCartStore";
import { usePrice } from "@/composables/usePrice";
import { useImage } from "@/composables/useImage";

const cartStore = useCartStore();
const currentPage = ref(1);
const itemsPerPage = ref(8);
const selectedUser = ref(0);
const search = ref("");

const { user, initAuth } = useAuth();
const { products, pageProduct, isLoading, fetchProducts } = useProducts();
const { formatPrice } = usePrice();
const { displayImage } = useImage();

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchProducts({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    status: 0,
    user_id: selectedUser.value,
    search: search.value,
  });
};

onMounted(() => {
  nextTick(async () => {
    await initAuth();
    if (user.value?.role === 1) {
      selectedUser.value = user.value.id;
    }
    await handlePageChange(1);
  });
});

const filterBySearch = async (payload: any) => {
  search.value = payload;
  await handlePageChange(1);
};

const addToCart = (product: any) => {
  cartStore.addItem(product);
};
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col p-6">
    <div class="mb-4 flex items-center gap-4">
      <FilterBySearch @search-filter="filterBySearch" />
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
            v-for="product in products"
            :key="product.id"
            class="flex flex-col rounded-lg p-4 shadow transition-shadow hover:shadow-lg"
          >
            <img
              :src="displayImage(product.image)"
              :alt="product.name"
              class="mb-4 aspect-square w-full rounded-lg object-cover"
            />
            <div class="flex flex-1 flex-col">
              <h3 class="font-medium text-gray-800">{{ product.name }}</h3>
              <p class="mb-3 text-sm text-gray-600">
                {{ product.description }}
              </p>
              <span
                class="font-bold text-gray-900 lg:grid-cols-2 wrap-anywhere mb-4"
                >{{ formatPrice(product.price) }}</span
              >
              <Button @click="addToCart(product)">Add to Cart</Button>
            </div>
          </div>
        </template>
      </div>

      <Pagination
        v-slot="{ page }"
        :items-per-page="itemsPerPage"
        :total="pageProduct.total"
        :default-page="currentPage"
        :sibling-count="1"
        :class="'mt-4'"
        show-edges
        @update:page="handlePageChange"
      >
        <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
          <PaginationFirst />
          <PaginationPrevious />
          <template v-for="(item, index) in items">
            <PaginationItem
              v-if="item.type === 'page'"
              :key="index"
              :value="item.value"
              :is-active="item.value === page"
            >
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else :key="item.type" :index="index" />
          </template>
          <PaginationNext />
          <PaginationLast />
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>
