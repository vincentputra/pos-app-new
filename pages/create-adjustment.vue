<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogScrollContent,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "vue-sonner";
import { Plus } from "lucide-vue-next";
import { useAuth } from "@/composables/useAuth";
import { useUsers } from "@/composables/useUsers";
import { useProducts } from "@/composables/useProducts";
import { usePrice } from "@/composables/usePrice";

const { user, initAuth } = useAuth();
const { usersByRole, fetchUsersByRole } = useUsers();
const {
  products,
  error,
  pageProduct,
  isLoading,
  fetchProducts,
  uploadImageAdjustment,
  updateStock,
} = useProducts();
const { formatPrice } = usePrice();

interface Adjustment {
  id: number;
  product: string;
  product_id: number;
  in_stock: number;
  actual_stock: number;
}

const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedUser = ref(0);
const selectedStockStatus = ref("all");
const search = ref("");
const isModalOpen = ref(false);
const adjustmentTable = ref<Adjustment[]>([]);

const form = reactive({
  note: "",
  image: null as File | null,
});

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchProducts({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    status: 0,
    stock_status: selectedStockStatus.value,
    user_id: selectedUser.value,
    search: search.value,
  });
};

const filterByUser = async (payload: any) => {
  selectedUser.value = Number(payload);
  await handlePageChange(1);
};

const filterBySearch = async (payload: any) => {
  search.value = payload;
  await handlePageChange(1);
};

const filterByStockStatus = async (payload: any) => {
  selectedStockStatus.value = payload;
  await handlePageChange(1);
};

const openProductModal = async () => {
  isModalOpen.value = true;
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    form.image = input.files[0];
  }
};

const handleAdjustmentSubmit = async () => {
  error.value = "";
  if (adjustmentTable.value.length === 0) {
    const message = "Please add product to adjustment stock";
    error.value = message;
    toast.error(message);
    return;
  }
  let imageUrl = "";
  if (form.image !== null) {
    const response = await uploadImageAdjustment(form.image);
    imageUrl = (response as any).data;
  }

  adjustmentTable.value.forEach(async (adjustment) => {
    const parameter = {
      product_id: adjustment.product_id,
      user_id: selectedUser.value,
      quantity: Number(adjustment.actual_stock),
      note: form.note,
      image: imageUrl,
    };
    await updateStock(parameter, {
      page: currentPage.value,
      per_page: itemsPerPage.value,
      status: 0,
      user_id: selectedUser.value,
    });
  });

  toast.success("Stock updated successfully");
  form.note = "";
  form.image = null;
  adjustmentTable.value = [];
};

watch(
  selectedUser,
  (newValue) => {
    filterByUser(newValue);
  },
  { immediate: true }
);

watch(
  selectedStockStatus,
  (newValue) => {
    filterByStockStatus(newValue);
  },
  { immediate: true }
);

onMounted(async () => {
  nextTick(async () => {
    await initAuth();
    await fetchUsersByRole(1);
    if (usersByRole.value?.length > 0) {
      selectedUser.value = usersByRole.value[0].id;
    }
    if (user.value?.role === 1) {
      selectedUser.value = user.value.id;
    }
    await handlePageChange(1);
  });
});

definePageMeta({
  layout: "authenticated",
  middleware: ["auth"],
});
</script>

<template>
  <div class="flex h-full w-[calc(100%-200px)] flex-1 flex-col">
    <header class="flex-none border-b border-gray-200 p-4">
      <h1 class="text-2xl font-semibold text-gray-800">Create Adjustment</h1>
    </header>

    <div class="flex flex-1 flex-col gap-4 px-4 py-10">
      <div class="mx-auto w-full max-w-3xl">
        <Button type="button" size="sm" @click="openProductModal">
          <Plus class="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      <Card class="mx-auto w-full max-w-3xl overflow-y-auto">
        <form @submit.prevent="handleAdjustmentSubmit">
          <CardContent class="px-0">
            <div class="grid items-center w-full gap-4 mb-4">
              <div
                class="flex flex-col space-y-1.5 px-4"
                v-if="user?.role !== 1"
              >
                <Label>Employee / Cashier</Label>
                <Select id="user" v-model="selectedUser">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select a cashier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="user in usersByRole"
                        :key="user.id"
                        :value="user.id"
                        >{{ user.name }}</SelectItem
                      >
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col space-y-1.5 px-4">
                <Label for="note">Note</Label>
                <Textarea id="note" v-model="form.note" />
              </div>
              <div class="flex flex-col space-y-1.5 px-4">
                <Label for="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  @change="handleFileChange"
                />
                <p class="text-sm text-muted-foreground wrap-anywhere">
                  {{ form.image?.name || "No file selected" }}
                </p>
              </div>
              <div class="flex flex-col space-y-1.5 px-4">
                <Label>Adjustment Stock Table</Label>
                <div class="rounded-lg border shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>In Stock</TableHead>
                        <TableHead>Actual Stock</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-for="adjustment in adjustmentTable">
                        <TableCell>{{ adjustment.product }}</TableCell>
                        <TableCell>{{ adjustment.in_stock }}</TableCell>
                        <TableCell>
                          <NumberField
                            :min="0"
                            :step="1"
                            v-model="adjustment.actual_stock"
                          >
                            <NumberFieldContent>
                              <NumberFieldDecrement />
                              <NumberFieldInput />
                              <NumberFieldIncrement />
                            </NumberFieldContent>
                          </NumberField>
                        </TableCell>
                        <TableCell>
                          <div class="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              @click="
                                adjustmentTable.splice(
                                  adjustmentTable.indexOf(adjustment),
                                  1
                                )
                              "
                              >Delete</Button
                            >
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div v-if="error" class="mt-2 text-sm text-red-600 px-4">
                {{ error }}
              </div>
            </div>
          </CardContent>
          <CardFooter class="px-4">
            <Button class="w-full" type="submit">Create</Button>
          </CardFooter>
        </form>
      </Card>
    </div>

    <Dialog :open="isModalOpen" @update:open="isModalOpen = false">
      <DialogScrollContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription class="font-medium text-gray-800">
            Add product to adjustment table
          </DialogDescription>
        </DialogHeader>
        <div class="mt-4 sm:flex items-center gap-4">
          <FilterBySearch @search-filter="filterBySearch" />
          <Select v-model="selectedStockStatus">
            <SelectTrigger class="w-full md:w-[180px] mb-4">
              <SelectValue placeholder="Select a stock status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All of the stocks</SelectItem>
                <SelectItem value="1">In Stock</SelectItem>
                <SelectItem value="0">Out of Stock</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div class="w-full rounded-lg border shadow-sm overflow-x-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    <div class="flex gap-2" v-if="product.id !== 0">
                      <Button
                        type="button"
                        size="sm"
                        @click="
                          adjustmentTable.push({
                            id: adjustmentTable.length + 1,
                            product: product.name,
                            product_id: product.id,
                            in_stock: Number(product.total_stock),
                            actual_stock: Number(product.total_stock),
                          })
                        "
                      >
                        Add
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
        <DialogFooter>
          <Button type="button" variant="ghost" @click="isModalOpen = false"
            >Close</Button
          >
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>
  </div>
</template>
