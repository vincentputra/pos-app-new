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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { RefreshCcw, Plus } from "lucide-vue-next";
import { useProducts } from "@/composables/useProducts";
import { usePrice } from "@/composables/usePrice";
import { useImage } from "@/composables/useImage";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  status: number;
  total_stock: number;
};

const {
  products,
  pageProduct,
  statusProduct,
  isLoading,
  error,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = useProducts();
const { formatPrice } = usePrice();
const { displayImage } = useImage();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const search = ref("");
const isModalOpen = ref(false);
const isEditing = ref(false);
const isDeleted = ref(false);
const editingId = ref<number | null>(null);

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchProducts({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    search: search.value,
  });
};

onMounted(() => {
  nextTick(async () => {
    await handlePageChange(1);
  });
});

const filterBySearch = async (payload: any) => {
  search.value = payload;
  await handlePageChange(1);
};

const form = reactive({
  name: "",
  description: "",
  price: 0,
  image: null as File | null,
  old_image: "",
  status: 0,
  total_stock: 0,
});

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    form.image = input.files[0];
  }
};

const openAddModal = () => {
  isEditing.value = false;
  isDeleted.value = false;
  editingId.value = null;
  resetForm();
  isModalOpen.value = true;
};

const openDeleteModal = (id: number) => {
  isEditing.value = false;
  isDeleted.value = true;
  editingId.value = id;
  isModalOpen.value = true;
};

const openEditModal = (product: Product) => {
  isEditing.value = true;
  isDeleted.value = false;
  editingId.value = product.id;
  form.name = product.name;
  form.description = product.description ?? "";
  form.price = Number(product.price);
  form.old_image = product.image;
  form.status = Number(product.status);
  form.total_stock = Number(product.total_stock);
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const resetForm = () => {
  form.name = "";
  form.description = "";
  form.price = 0;
  form.image = null;
  form.old_image = "";
  form.status = 0;
  form.total_stock = 0;
};

const handleSubmit = async () => {
  if (isEditing.value) {
    // Here you would typically make an API call to update the product
    const response = await updateProduct({
      id: editingId.value,
      name: form.name,
      description: form.description,
      price: form.price,
      image: form.image,
      status: form.status,
    });

    if (error.value) {
      toast.error(error.value ?? "Something went wrong");
      return;
    }

    // Update existing product
    const index = products.value.findIndex(
      (s) => Number(s.id) === editingId.value
    );

    if (index !== -1) {
      products.value[index] = {
        id: editingId.value!,
        name: (response as any).data.name ?? form.name,
        description: (response as any).data.description ?? form.description,
        price: (response as any).data.price ?? form.price,
        image: (response as any).data.image ?? form.image,
        status: Number((response as any).data.status ?? form.status),
        total_stock: form.total_stock,
      };

      if (form.status === 2) {
        products.value = products.value.filter((s) => s.id !== editingId.value);
      }
    }

    toast.success("Product updated successfully");
  } else {
    // Here you would typically make an API call to add the product
    const response = await createProduct({
      name: form.name,
      description: form.description,
      price: form.price,
      image: form.image,
      status: form.status,
    });

    if (error.value) {
      toast.error(error.value ?? "Something went wrong");
      return;
    }

    // Add new product
    products.value.push({
      id: (response as any).id ?? Date.now(),
      name: (response as any).name ?? form.name,
      description: (response as any).description ?? form.description,
      price: (response as any).price ?? form.price,
      image: (response as any).image ?? form.image,
      status: Number((response as any).status ?? form.status),
      total_stock: form.total_stock,
    });

    toast.success("Product added successfully");
  }
  closeModal();
};

const handleDelete = async () => {
  await deleteProduct({ id: editingId.value });

  if (error.value) {
    toast.error(error.value ?? "Something went wrong");
    return;
  }

  // Here you would typically make an API call to delete the product
  products.value = products.value.filter((s) => s.id !== editingId.value);
  toast.success("Product deleted successfully");
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
        <h1 class="text-2xl font-semibold text-gray-800">Product Inventory</h1>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="
              fetchProducts({
                page: currentPage,
                per_page: itemsPerPage,
                search: search,
              })
            "
          >
            <RefreshCcw class="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" size="sm" @click="openAddModal">
            <Plus class="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>
    </header>

    <div class="custom-scrollbar min-h-0 flex-1 p-4">
      <div class="mb-4 flex items-center gap-4">
        <FilterBySearch @search-filter="filterBySearch" />
      </div>
      <div class="rounded-lg border shadow-sm">
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
                <TableCell>{{
                  statusProduct.find((r) => r.id === product.status)?.name
                }}</TableCell>
                <TableCell>
                  <div class="flex gap-2" v-if="product.id !== 0">
                    <Button
                      type="button"
                      size="sm"
                      @click="openEditModal(product)"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      @click="openDeleteModal(product.id)"
                    >
                      Delete
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

    <!-- Add/Edit Modal -->
    <Dialog :open="isModalOpen" @update:open="closeModal">
      <DialogContent v-if="!isDeleted">
        <DialogHeader>
          <DialogTitle>{{
            isEditing ? "Edit Product" : "Add Product"
          }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" v-model="form.name" required />
          </div>
          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Textarea id="description" v-model="form.description" />
          </div>
          <div class="space-y-2">
            <NumberField
              id="amount"
              v-model="form.price"
              :format-options="{
                style: 'currency',
                currency: 'IDR',
                currencyDisplay: 'code',
                currencySign: 'accounting',
              }"
            >
              <Label for="amount">Price</Label>
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
          </div>
          <div class="space-y-2">
            <Label for="image"
              >Image (Leave it empty if you don't need to upload image)</Label
            >
            <Input
              id="image"
              type="file"
              accept="image/*"
              @change="handleFileChange"
            />
            <p class="text-sm text-muted-foreground wrap-anywhere">
              {{ form.image?.name || "No file selected" }}
            </p>
            <NuxtLink
              v-if="form.old_image"
              :to="displayImage(form.old_image)"
              target="_blank"
            >
              <img
                class="h-48 w-96 object-scale-down"
                :src="displayImage(form.old_image)"
              />
            </NuxtLink>
          </div>
          <div class="space-y-2">
            <Label>Status</Label>
            <Select v-model="form.status">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem
                    v-for="status in statusProduct"
                    :key="status.id"
                    :value="status.id"
                    >{{ status.name }}</SelectItem
                  >
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div v-if="error" class="mt-2 text-sm text-red-600">
            {{ error }}
          </div>
          <DialogFooter class="sm:justify-between">
            <Button type="button" variant="ghost" @click="closeModal"
              >Cancel</Button
            >
            <Button type="submit">{{ isEditing ? "Update" : "Add" }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <DialogContent v-else>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to permanently
            delete this file from our servers?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="sm:justify-between">
          <Button type="button" variant="ghost" @click="closeModal"
            >Cancel</Button
          >
          <Button type="submit" @click="handleDelete">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
