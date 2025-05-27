<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Minus,
  Plus,
  CircleX,
  Printer,
  TicketPercent,
  Loader2,
} from "lucide-vue-next";
import { useShifts } from "@/composables/useShifts";
import { useDiscounts } from "@/composables/useDiscounts";
import { useTransactions } from "@/composables/useTransactions";
import { useCartStore } from "@/stores/useCartStore";
import { usePrice } from "@/composables/usePrice";
import { useStorage } from "@/composables/useStorage";
import { toast } from "vue-sonner";

const storage = useStorage();
const cartStore = useCartStore();
const { formatPrice } = usePrice();
const { taxAmount, paymentMethods, error, createTransaction } =
  useTransactions();
const { shiftUser, initShiftUser } = useShifts();
const {
  discounts,
  pageDiscount,
  statusDiscount,
  typeDiscount,
  isLoading,
  fetchDiscounts,
} = useDiscounts();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedDiscountType = ref(0);
const search = ref("");
const isModalOpen = ref(false);
const showPaymentDialog = ref(false);
const selectedDiscount = ref<number | null>(null);
const selectedPaymentMethod = ref("cash");
const amountPaid = ref<number | undefined>(undefined);
const change = ref(0);

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchDiscounts({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    type: selectedDiscountType.value,
    search: search.value,
    status: 0,
  });
};

onMounted(() => {
  nextTick(async () => {
    await initShiftUser();
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

const discount = computed(() => {
  return discounts.value.find((item) => item.id === selectedDiscount.value);
});
const discountAmount = computed(() => {
  if (selectedDiscount.value === null) {
    return 0;
  }
  if (discount.value?.type === 2) {
    return (subtotal.value * discount.value.amount) / 100;
  } else {
    return discount.value?.amount || 0;
  }
});
const cartItems = computed(() => cartStore.items);
const subtotal = computed(() => cartStore.subtotal);
const tax = computed(() => (subtotal.value - discountAmount.value) * taxAmount);
const total = computed(() => subtotal.value - discountAmount.value + tax.value);
const isProcessing = ref(false);

const incrementQuantity = (item: any) => {
  cartStore.updateQuantity(item.id, item.quantity + 1);
};

const decrementQuantity = (item: any) => {
  cartStore.updateQuantity(item.id, item.quantity - 1);
};

const calculateChange = () => {
  if (!amountPaid.value) {
    change.value = 0;
    return;
  }
  change.value = amountPaid.value - total.value;
};

const handlePrintBill = async () => {
  error.value = "";
  if (cartItems.value.length === 0) return;
  if (!amountPaid.value || amountPaid.value < total.value) {
    error.value = "Please input the correct amount paid";
    return;
  }
  if (!selectedPaymentMethod.value) {
    error.value = "Please select a payment method";
    return;
  }

  isProcessing.value = true;
  try {
    const storedUser = storage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).id : null;

    const payload = {
      shift_id: shiftUser.value?.id ?? 0,
      user_id: userId,
      discount_id: selectedDiscount.value || null,
      payment_method: selectedPaymentMethod.value,
      total_price: total.value,
      total_payment: amountPaid.value || total.value,
      total_tax: tax.value,
      type_discount: discount.value?.type || 0,
      amount_discount: discount.value?.amount || 0,
      payment_status: "paid",
      date: new Intl.DateTimeFormat("en-CA").format(new Date()),
      details: cartItems.value.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: subtotal.value,
      change: change.value,
    };

    await createTransaction(payload);
    cartStore.reset();
    toast.success("Bill has been printed and transaction recorded");
  } catch (error) {
    console.error("Transaction failed:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to process transaction"
    );
  } finally {
    isProcessing.value = false;
  }
  selectedDiscount.value = null;
  selectedPaymentMethod.value = "cash";
  amountPaid.value = undefined;
  change.value = 0;
  error.value = "";
  showPaymentDialog.value = false;
};
</script>

<template>
  <aside
    class="flex flex-1 flex-col h-screen overflow-hidden border-l border-gray-200"
  >
    <div class="flex-none border-b border-gray-200 p-4">
      <h2 class="text-lg font-semibold text-gray-800">Shopping Cart</h2>
    </div>

    <div class="flex-auto overflow-auto">
      <div v-if="cartItems.length === 0" class="mt-8 text-center text-gray-500">
        Cart is empty
      </div>

      <div v-else>
        <div
          v-for="item in cartItems"
          :key="item.id"
          class="flex justify-between gap-2 border-b-1 p-4"
        >
          <div class="flex flex-col">
            <h3 class="font-medium text-gray-800">{{ item.name }}</h3>
            <p class="text-sm text-gray-600">
              {{ formatPrice(item.price) }}
            </p>
          </div>
          <div class="flex items-center">
            <Button
              variant="outline"
              size="icon"
              @click="decrementQuantity(item)"
            >
              <Minus class="h-4 w-4" />
            </Button>
            <span class="w-8 text-center">{{ item.quantity }}</span>
            <Button
              variant="outline"
              size="icon"
              @click="incrementQuantity(item)"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-none space-y-4 border-t border-gray-200 p-4">
      <div class="space-y-2">
        <div class="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{{ formatPrice(subtotal) }}</span>
        </div>
        <div class="flex items-center justify-between text-gray-600">
          <span>Discount</span>
          <div class="space-x-2">
            <!-- <input
              type="number"
              v-model="discountAmount"
              class="w-20 rounded-lg border border-gray-200 p-2 text-right"
              min="0"
              :max="subtotal"
              placeholder="0.00"
            /> -->
            <Button
              v-if="selectedDiscount !== null"
              variant="destructive"
              class="w-full"
              @click="selectedDiscount = null"
            >
              <CircleX class="mr-2 h-4 w-4" />
              {{ formatPrice(discountAmount) }}
            </Button>
            <Button v-else class="w-full" @click="isModalOpen = true">
              <TicketPercent class="mr-2 h-4 w-4" />
              Apply Discount
            </Button>
          </div>
        </div>
        <div class="flex justify-between text-gray-600">
          <span>Tax ({{ taxAmount * 100 }}%)</span>
          <span>{{ formatPrice(tax) }}</span>
        </div>
        <div class="flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>{{ formatPrice(total) }}</span>
        </div>
      </div>

      <Button
        class="w-full"
        size="lg"
        :disabled="cartItems.length === 0 || isProcessing"
        @click="
          showPaymentDialog = true;
          error = '';
        "
      >
        <Printer class="mr-2 h-4 w-4" />
        Print Bill
      </Button>
    </div>
    <Dialog :open="showPaymentDialog" @update:open="showPaymentDialog = false">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Complete the payment information below to proceed.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>{{ formatPrice(total) }}</span>
          </div>
          <div class="flex justify-between font-bold text-gray-900">
            <span>Change</span>
            <span :class="change >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatPrice(change) }}
            </span>
          </div>
          <div class="space-y-2">
            <Label for="amount">Amount Paid</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              v-model="amountPaid"
              class="text-center"
              :placeholder="formatPrice(total)"
              @input="calculateChange"
              required
            />
            <!-- <input
              id="amount"
              type="number"
              v-model="amountPaid"
              class="w-full rounded-lg border border-gray-200 p-2 text-left"
              min="0"
              :placeholder="formatPrice(total)"
              @input="calculateChange"
            /> -->
          </div>
          <div class="space-y-2">
            <Label>Payment Method</Label>
            <Select v-model="selectedPaymentMethod">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="method in paymentMethods"
                    :key="method.id"
                    :value="method.id"
                    >{{ method.name }}</SelectItem
                  >
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div v-if="error" class="mt-2 text-sm text-red-600">
            {{ error }}
          </div>
        </div>
        <DialogFooter class="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            @click="showPaymentDialog = false"
          >
            Cancel
          </Button>
          <Button :disabled="isProcessing" @click="handlePrintBill">
            <Loader2 v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
            {{ isProcessing ? "Processing..." : "Confirm Payment" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="isModalOpen" @update:open="isModalOpen = false">
      <DialogScrollContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription class="font-medium text-gray-800">
            Choose a discount to apply to your cart.
          </DialogDescription>
        </DialogHeader>
        <div class="mt-4 mb-4 flex items-center gap-4">
          <FilterByDiscountType @type-change="filterByDiscountType" />
          <FilterBySearch @search-filter="filterBySearch" />
        </div>
        <div class="w-full rounded-lg border shadow-sm overflow-x-scroll">
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
                <TableRow
                  v-for="(discount, index) in discounts"
                  :key="discount.id"
                >
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
                        @click="
                          selectedDiscount = discount.id;
                          isModalOpen = false;
                        "
                      >
                        Apply
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
        <DialogFooter>
          <Button type="button" variant="ghost" @click="isModalOpen = false"
            >Close</Button
          >
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>
  </aside>
</template>
