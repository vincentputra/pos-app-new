<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { RefreshCcw, Plus } from "lucide-vue-next";
import { useDate } from "@/composables/useDate";
import { useProducts } from "@/composables/useProducts";
import { useImage } from "@/composables/useImage";

const {
  statusStock,
  adjustmentProducts,
  pageProduct,
  isLoading,
  fetchAdjustmentProducts,
} = useProducts();
const { formatDateTime } = useDate();
const { displayImage } = useImage();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedUser = ref(0);

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchAdjustmentProducts({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    user_id: selectedUser.value,
  });
};

onMounted(() => {
  nextTick(async () => {
    await handlePageChange(1);
  });
});

const filterByUser = async (payload: any) => {
  selectedUser.value = payload;
  await handlePageChange(1);
};

definePageMeta({
  layout: "authenticated",
  middleware: ["auth"],
});
</script>

<template>
  <div class="flex h-full w-full flex-1 flex-col">
    <header class="flex-none border-b border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-800">
          Inventory Adjustment
        </h1>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="
              fetchAdjustmentProducts({
                page: currentPage,
                per_page: itemsPerPage,
                user_id: selectedUser,
              })
            "
          >
            <RefreshCcw class="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <NuxtLink to="/create-adjustment">
            <Button type="button" size="sm">
              <Plus class="mr-2 h-4 w-4" />
              Create Adjustment
            </Button>
          </NuxtLink>
        </div>
      </div>
    </header>

    <div class="custom-scrollbar min-h-0 flex-1 p-4">
      <div class="mb-4 flex items-center gap-4">
        <FilterByCashier @user-change="filterByUser" />
        <FilterByDate />
      </div>
      <div class="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Adjustment Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Image</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="isLoading">
              <TableRow v-for="n in pageProduct.total ?? 5" :key="n">
                <TableCell v-for="m in 5" :key="m">
                  <div class="h-4 w-24 animate-pulse rounded bg-gray-100" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else-if="adjustmentProducts.length">
              <TableRow
                v-for="adjustment in adjustmentProducts"
                :key="adjustment.id"
              >
                <TableCell>{{
                  formatDateTime(adjustment.created_at)
                }}</TableCell>
                <TableCell>{{ adjustment.user.name }}</TableCell>
                <TableCell>{{ adjustment.product.name }}</TableCell>
                <TableCell>{{ adjustment.note }}</TableCell>
                <TableCell>{{
                  adjustment.type === 1
                    ? `-${adjustment.quantity}`
                    : adjustment.quantity
                }}</TableCell>
                <TableCell>{{
                  statusStock.find((r) => r.id === adjustment.type)?.name
                }}</TableCell>
                <TableCell>
                  <NuxtLink
                    v-if="adjustment.image"
                    :to="displayImage(adjustment.image)"
                    target="_blank"
                  >
                    <img
                      class="h-48 w-96 object-scale-down"
                      :src="displayImage(adjustment.image)"
                    />
                  </NuxtLink>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
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
