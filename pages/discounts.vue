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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
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
import { useDiscounts } from "@/composables/useDiscounts";
import { usePrice } from "@/composables/usePrice";

const {
  discounts,
  pageDiscount,
  statusDiscount,
  typeDiscount,
  isLoading,
  error,
  fetchDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} = useDiscounts();
const { formatPrice } = usePrice();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedDiscountType = ref(0);
const search = ref("");
const isModalOpen = ref(false);
const isEditing = ref(false);
const isDeleted = ref(false);
const editingId = ref<number | null>(null);

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchDiscounts({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    type: selectedDiscountType.value,
    search: search.value,
  });
};

onMounted(() => {
  nextTick(async () => {
    await handlePageChange(1);
  });
});

const filterByDiscountType = async (payload: any) => {
  selectedDiscountType.value = Number(payload);
  await handlePageChange(1);
};

const filterBySearch = async (payload: any) => {
  search.value = payload;
  await handlePageChange(1);
};

const form = reactive({
  name: "",
  description: "",
  type: "1",
  amount: 0,
  status: 0,
});

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

const openEditModal = (discount: any) => {
  isEditing.value = true;
  isDeleted.value = false;
  editingId.value = discount.id;
  form.name = discount.name;
  form.description = discount.description ?? "";
  form.type = discount.type.toString();
  form.amount = Number(discount.amount);
  form.status = Number(discount.status);
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const resetForm = () => {
  form.name = "";
  form.description = "";
  form.type = "1";
  form.amount = 0;
  form.status = 0;
};

const handleSubmit = async () => {
  let amount = Number(form.amount);
  if (isEditing.value) {
    // Here you would typically make an API call to update the discount
    const response = await updateDiscount({
      id: editingId.value,
      name: form.name,
      description: form.description,
      type: Number(form.type),
      amount: amount,
      status: form.status,
    });

    if (error.value) {
      toast.error(error.value ?? "Something went wrong");
      return;
    }

    // Update existing product
    const index = discounts.value.findIndex(
      (s) => Number(s.id) === editingId.value
    );

    if (index !== -1) {
      discounts.value[index] = {
        id: editingId.value!,
        name: (response as any).data.name ?? form.name,
        description: (response as any).data.description ?? form.description,
        type: Number((response as any).data.type ?? form.type),
        amount: (response as any).data.amount ?? amount,
        status: Number((response as any).data.status ?? form.status),
      };

      if (form.status === 2) {
        discounts.value = discounts.value.filter(
          (s) => s.id !== editingId.value
        );
      }
    }

    toast.success("Discount updated successfully");
  } else {
    // Here you would typically make an API call to add the product
    const response = await createDiscount({
      name: form.name,
      description: form.description,
      type: Number(form.type),
      amount: amount,
      status: form.status,
    });

    if (error.value) {
      toast.error(error.value ?? "Something went wrong");
      return;
    }

    // Add new product
    discounts.value.push({
      id: (response as any).id ?? Date.now(),
      name: (response as any).name ?? form.name,
      description: (response as any).description ?? form.description,
      type: (response as any).data.type.toString() ?? form.type,
      amount: (response as any).data.amount ?? amount,
      status: Number((response as any).data.status ?? form.status),
    });

    toast.success("Discount added successfully");
  }
  closeModal();
};

const handleDelete = async () => {
  await deleteDiscount({ id: editingId.value });

  if (error.value) {
    toast.error(error.value ?? "Something went wrong");
    return;
  }

  // Here you would typically make an API call to delete the discount
  discounts.value = discounts.value.filter((s) => s.id !== editingId.value);
  toast.success("Discount deleted successfully");
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
        <h1 class="text-2xl font-semibold text-gray-800">Discount</h1>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="
              fetchDiscounts({
                page: currentPage,
                per_page: itemsPerPage,
                type: selectedDiscountType,
                search: search,
              })
            "
          >
            <RefreshCcw class="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" size="sm" @click="openAddModal">
            <Plus class="mr-2 h-4 w-4" />
            Add Discount
          </Button>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex-1 p-4">
      <div class="mb-4 flex items-center gap-4">
        <FilterByDiscountType @type-change="filterByDiscountType" />
        <FilterBySearch @search-filter="filterBySearch" />
      </div>
      <div class="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="isLoading">
              <TableRow v-for="n in pageDiscount.total ?? 5" :key="n">
                <TableCell v-for="m in 5" :key="m">
                  <div class="h-4 w-24 animate-pulse rounded bg-gray-100" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else-if="discounts.length">
              <TableRow v-for="discount in discounts" :key="discount.id">
                <TableCell>{{ discount.name }}</TableCell>
                <TableCell>{{ discount.description }}</TableCell>
                <TableCell>{{
                  typeDiscount.find((r) => r.id === discount.type)?.name
                }}</TableCell>
                <TableCell v-if="discount.type == 1">{{
                  formatPrice(discount.amount)
                }}</TableCell>
                <TableCell v-else>{{ discount.amount }}%</TableCell>
                <TableCell>{{
                  statusDiscount.find((r) => r.id === discount.status)?.name
                }}</TableCell>
                <TableCell>
                  <div class="flex gap-2" v-if="discount.id !== 0">
                    <Button
                      type="button"
                      size="sm"
                      @click="openEditModal(discount)"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      @click="openDeleteModal(discount.id)"
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
        :total="pageDiscount.total"
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
            isEditing ? "Edit Discount" : "Add Discount"
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
            <Label for="type">Type</Label>
            <RadioGroup
              id="type"
              :default-value="1"
              v-model="form.type"
              :orientation="'horizontal'"
            >
              <div class="flex items-center space-x-2">
                <RadioGroupItem id="r1" value="1" />
                <Label for="r1">Fixed Amount</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem id="r2" value="2" />
                <Label for="r2">Percentage</Label>
              </div>
            </RadioGroup>
          </div>
          <div class="space-y-2">
            <NumberField
              id="amount"
              v-model="form.amount"
              :min="0"
              :step="form.type == '1' ? 1000 : 1"
            >
              <Label for="amount">Amount</Label>
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
          </div>
          <div class="space-y-2">
            <Label>Status</Label>
            <Select v-model="form.status">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="status in statusDiscount"
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
