<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Label } from "@/components/ui/label";
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
import { toast } from "vue-sonner";
import { RefreshCcw } from "lucide-vue-next";
import { useProducts } from "@/composables/useProducts";
import { usePrice } from "@/composables/usePrice";

const { products, pageProduct, isLoading, error, fetchProducts, updateStock } =
  useProducts();
const { formatPrice } = usePrice();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedUser = ref(0);
const search = ref("");
const isModalOpen = ref(false);
const editingId = ref<number | null>(null);

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
    await handlePageChange(1);
  });
});

const filterByUser = async (payload: any) => {
  selectedUser.value = Number(payload);
  await handlePageChange(1);
};

const filterBySearch = async (payload: any) => {
  search.value = payload;
  await handlePageChange(1);
};

const form = reactive({
  product_id: 0,
  user_id: 0,
  quantity: 0,
});

const openStockModal = async (stock: any) => {
  editingId.value = stock.id;
  form.product_id = stock.id;
  form.user_id = selectedUser.value;
  form.quantity = Number(stock.total_stock);
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const handleUpdateStock = async () => {
  await updateStock(form, {
    page: currentPage.value,
    per_page: itemsPerPage.value,
    status: 0,
    user_id: selectedUser.value,
    search: search.value,
  });

  toast.success("Stock updated successfully");
  closeModal();
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
        <h1 class="text-2xl font-semibold text-gray-800">Inventory Summary</h1>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="
              fetchProducts({
                page: currentPage,
                per_page: itemsPerPage,
                status: 0,
                user_id: selectedUser,
                search: search,
              })
            "
          >
            <RefreshCcw class="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex-1 p-4">
      <div class="mb-4 flex items-center gap-4">
        <FilterByCashier @user-change="filterByUser" />
        <FilterBySearch @search-filter="filterBySearch" />
      </div>
      <div class="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead v-if="selectedUser != 0">Actions</TableHead>
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
            <template v-else-if="products.length">
              <TableRow v-for="product in products" :key="product.id">
                <TableCell>{{ product.name }}</TableCell>
                <TableCell>{{ formatPrice(product.price) }}</TableCell>
                <TableCell>{{ product.total_stock }}</TableCell>
                <TableCell
                  :class="
                    Number(product.total_stock) === 0 ? 'text-red-600' : ''
                  "
                >
                  {{
                    Number(product.total_stock) === 0
                      ? "Out of Stock"
                      : "In Stock"
                  }}
                </TableCell>
                <TableCell v-if="selectedUser != 0">
                  <div class="flex gap-2" v-if="product.id !== 0">
                    <Button
                      type="button"
                      size="sm"
                      @click="openStockModal(product)"
                    >
                      Update Stock
                    </Button>
                  </div>
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

    <!-- Update Stock Modal -->
    <Dialog :open="isModalOpen" @update:open="closeModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Stock Product</DialogTitle>
          <DialogDescription>
            In Stock:
            <span class="ml-2 font-medium text-gray-800">
              {{ form.quantity }}
            </span>
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleUpdateStock" class="space-y-4">
          <div class="space-y-2">
            <NumberField id="stock" v-model="form.quantity">
              <Label for="stock">Actual Stock</Label>
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
          </div>
          <div v-if="error" class="mt-2 text-sm text-red-600">
            {{ error }}
          </div>
          <DialogFooter class="sm:justify-between">
            <Button type="button" variant="ghost" @click="closeModal"
              >Cancel</Button
            >
            <Button type="submit">Update</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
