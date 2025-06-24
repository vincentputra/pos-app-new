<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  DialogScrollContent,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { RefreshCcw, Loader2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useAuth } from "@/composables/useAuth";
import { useTransactions } from "@/composables/useTransactions";
import { usePrice } from "@/composables/usePrice";
import { useDate } from "@/composables/useDate";

const { user, initAuth } = useAuth();
const {
  transactions,
  pageTransaction,
  statusTransaction,
  paymentMethods,
  isLoading,
  error,
  fetchTransactions,
  createTransaction,
  deleteTransaction,
  formatNoReceipt,
  calculateDiscount,
  calculateChange,
} = useTransactions();
const { formatPrice } = usePrice();
const { dateRange, formatDateTime } = useDate();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedStatus = ref("all");
const selectedPaymentMethod = ref("all");
const selectedUser = ref(0);
const search = ref("");
const selectedTransaction = ref(0);
const isModalOpen = ref(false);
const isRefunded = ref(false);
const isDeleted = ref(false);
const editingId = ref<number | null>(null);
const isProcessing = ref(false);

const statusRefund = "refunded";
const refundReasons = [
  { id: "0", name: "Produk Return" },
  { id: "1", name: "Misplaced Transaction" },
  { id: "2", name: "Order cancelation" },
  { id: "3", name: "Others" },
];

// refund
const refundData = ref({
  shift_id: 0,
  user_id: 0,
  discount_id: 0,
  payment_method: "cash",
  total_price: 0,
  total_payment: 0,
  total_tax: 0,
  tax: 0,
  type_discount: 0,
  amount_discount: 0,
  discount: 0,
  payment_status: statusRefund,
  date: new Intl.DateTimeFormat("en-CA").format(new Date()),
  details: [
    {
      product_id: 0,
      quantity: 0,
      price: 0,
      subtotal: 0,
      old_quantity: 0,
      is_refunded: false,
    },
  ],
  subtotal: 0,
  change: 0,
  type_reason: "0",
  reason: "",
});

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchTransactions({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    status: selectedStatus.value,
    payment_method: selectedPaymentMethod.value,
    user_id: selectedUser.value,
    search: search.value,
    date_range: dateRange.value,
  });
};

const filterByUser = async (payload: any) => {
  selectedUser.value = Number(payload);
  await handlePageChange(1);
};

/* const filterBySearch = async (payload: any) => {
  search.value = payload;
  await handlePageChange(1);
}; */

const filterByStatus = async (payload: any) => {
  selectedStatus.value = payload;
  await handlePageChange(1);
};

const filterByMethod = async (payload: any) => {
  selectedPaymentMethod.value = payload;
  await handlePageChange(1);
};

const filterByDate = async (payload: any) => {
  dateRange.value = payload;
  await handlePageChange(1);
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

const openDetailModal = async (id: number) => {
  isDeleted.value = false;
  isRefunded.value = false;
  selectedTransaction.value = id;
  isModalOpen.value = true;
};

const openDeleteModal = (id: number) => {
  isDeleted.value = true;
  isRefunded.value = false;
  editingId.value = id;
  isModalOpen.value = true;
};

const handleDelete = async () => {
  await deleteTransaction({ id: editingId.value });

  if (error.value) {
    toast.error(error.value ?? "Something went wrong");
    return;
  }

  // Here you would typically make an API call to delete the transaction
  transactions.value = transactions.value.filter(
    (s) => s.id !== editingId.value
  );
  toast.success("Transaction deleted successfully");
  isModalOpen.value = false;
};

const openRefundModal = (id: number) => {
  isDeleted.value = false;
  isRefunded.value = true;
  selectedTransaction.value = id;
  refundData.value = {
    shift_id: transactions.value[selectedTransaction.value].shift_id,
    user_id: transactions.value[selectedTransaction.value].user.id,
    discount_id: transactions.value[selectedTransaction.value].discount_id,
    payment_method:
      transactions.value[selectedTransaction.value].payment_method,
    total_price: transactions.value[selectedTransaction.value].total_price,
    total_payment: transactions.value[selectedTransaction.value].total_payment,
    total_tax: transactions.value[selectedTransaction.value].total_tax,
    tax:
      (transactions.value[selectedTransaction.value].total_price -
        transactions.value[selectedTransaction.value].total_tax) /
      transactions.value[selectedTransaction.value].total_tax,
    type_discount: transactions.value[selectedTransaction.value].type_discount,
    amount_discount:
      transactions.value[selectedTransaction.value].amount_discount,
    discount: calculateDiscount(
      transactions.value[selectedTransaction.value].total_subtotal,
      transactions.value[selectedTransaction.value].type_discount,
      transactions.value[selectedTransaction.value].amount_discount
    ),
    payment_status: statusRefund,
    date: new Intl.DateTimeFormat("en-CA").format(new Date()),
    details: transactions.value[selectedTransaction.value].details.map(
      (detail) => ({
        product_id: detail.product.id,
        quantity: detail.quantity,
        price: detail.price,
        subtotal: detail.subtotal,
        old_quantity: detail.quantity,
        is_refunded: true,
      })
    ),
    subtotal: transactions.value[selectedTransaction.value].total_subtotal,
    change:
      transactions.value[selectedTransaction.value].total_payment -
      transactions.value[selectedTransaction.value].total_price,
    type_reason: "0",
    reason: "",
  };
  isModalOpen.value = true;
};

const calculateRefund = (index: number, is_refunded?: boolean) => {
  // Destructure the item to simplify access
  const item = refundData.value.details[index];

  // Set is_refunded
  item.is_refunded = is_refunded || item.is_refunded;

  // Clamp quantity to maxQty
  const maxQty = Number(item.old_quantity);
  let qty = Number(item.quantity);
  if (qty > maxQty) {
    item.quantity = maxQty;
    toast.error("Refund quantity cannot be greater than the original quantity");
    return;
  }

  // Calculate subtotal for current item
  item.subtotal = Number(item.quantity * item.price);

  // Calculate overall subtotal from all refunded items
  const subtotal = refundData.value.details.reduce((acc, detail) => {
    return detail.is_refunded ? acc + detail.price * detail.quantity : acc;
  }, 0);

  // Update refund data
  refundData.value.subtotal = subtotal;

  // Calculate discount
  const discount = calculateDiscount(
    subtotal,
    refundData.value.type_discount,
    Number(refundData.value.amount_discount)
  );
  refundData.value.discount = discount;

  // Apply discount and calculate tax/total
  const discountedTotal = subtotal - discount;

  const totalTax =
    discountedTotal > 0 ? discountedTotal / refundData.value.tax : 0;
  refundData.value.total_tax = totalTax;
  refundData.value.total_price =
    discountedTotal > 0 ? discountedTotal + totalTax : 0;
};

const handleRefund = async () => {
  error.value = "";
  if (refundData.value.details.length === 0) {
    error.value = "No products to refund";
    return;
  }
  const refundedItems = refundData.value.details.filter(
    (item) => item.is_refunded
  );
  if (refundedItems.length === 0) {
    error.value = "No products to refund";
    return;
  }

  isProcessing.value = true;
  try {
    const payload = {
      shift_id: refundData.value.shift_id,
      user_id: user.value?.id || 0,
      discount_id: refundData.value.discount_id || null,
      payment_method: refundData.value.payment_method,
      total_price: refundData.value.total_price,
      total_payment: refundData.value.total_price,
      total_tax: refundData.value.total_tax,
      type_discount: refundData.value.type_discount,
      amount_discount: refundData.value.amount_discount,
      payment_status: refundData.value.payment_status,
      date: new Intl.DateTimeFormat("en-CA").format(new Date()),
      details: refundedItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: refundData.value.subtotal,
      change: refundData.value.change,
      type_reason: refundData.value.type_reason,
      reason: refundData.value.reason,
      trans_id: transactions.value[selectedTransaction.value].id,
    };

    await createTransaction(payload);
    toast.success("Refund processed successfully");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to process refund";
  } finally {
    isProcessing.value = false;
  }
  await handlePageChange(1);
  isModalOpen.value = false;
};

definePageMeta({
  layout: "authenticated",
  middleware: ["auth"],
});
</script>

<template>
  <div class="flex h-full w-full flex-1 flex-col overflow-hidden">
    <header class="flex-none border-b border-gray-200 p-4">
      <div class="sm:flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-800">
          Transactions Report
        </h1>
        <div class="flex items-center gap-2 pt-4 sm:pt-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="
              fetchTransactions({
                page: currentPage,
                per_page: itemsPerPage,
                status: selectedStatus,
                payment_method: selectedPaymentMethod,
                user_id: selectedUser,
                search: search,
                date_range: dateRange,
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
      <div class="sm:flex items-center gap-4">
        <FilterByCashier @user-change="filterByUser" v-if="user?.role !== 1" />
        <FilterByStatusTrans @status-change="filterByStatus" />
        <FilterByPaymentMethod @method-change="filterByMethod" />
        <FilterByDate @date-change="filterByDate" />
        <!-- <FilterBySearch @search-filter="filterBySearch" /> -->
      </div>
      <div class="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt Number</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="isLoading">
              <TableRow v-for="n in pageTransaction.total ?? 5" :key="n">
                <TableCell v-for="m in 5" :key="m">
                  <div class="h-4 w-24 animate-pulse rounded bg-gray-100" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else-if="transactions.length">
              <TableRow v-for="(trans, index) in transactions" :key="trans.id">
                <TableCell>{{
                  formatNoReceipt({
                    id: trans.id,
                    date: trans.date,
                    user: trans.user.id,
                  })
                }}</TableCell>
                <TableCell>{{ trans.user.name }}</TableCell>
                <TableCell>{{ formatDateTime(trans.created_at) }}</TableCell>
                <TableCell>{{ formatPrice(trans.total_price) }}</TableCell>
                <TableCell
                  :class="[
                    trans.payment_status === statusRefund ? 'text-red-600' : '',
                  ]"
                  >{{
                    statusTransaction.find((r) => r.id === trans.payment_status)
                      ?.name
                  }}</TableCell
                >
                <TableCell>{{
                  paymentMethods.find((r) => r.id === trans.payment_method)
                    ?.name
                }}</TableCell>
                <TableCell>
                  <div class="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      @click="openDetailModal(index)"
                    >
                      Detail
                    </Button>
                    <Button
                      v-if="user?.role !== 1"
                      type="button"
                      variant="destructive"
                      size="sm"
                      @click="openDeleteModal(trans.id)"
                    >
                      Delete
                    </Button>
                    <Button
                      v-if="user?.role === 1 && trans.payment_status === 'paid'"
                      type="button"
                      variant="destructive"
                      size="sm"
                      @click="openRefundModal(index)"
                    >
                      Refund
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
        :total="pageTransaction.total"
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

    <Dialog :open="isModalOpen" @update:open="isModalOpen = false">
      <DialogScrollContent v-if="!isDeleted">
        <DialogHeader>
          <DialogTitle class="mb-4">
            {{
              formatNoReceipt({
                id: transactions[selectedTransaction].id,
                date: transactions[selectedTransaction].date,
                user: transactions[selectedTransaction].user.id,
              })
            }}
          </DialogTitle>
          <DialogDescription class="font-medium text-gray-800 space-y-2">
            <div>
              Receipt Date:
              {{ formatDateTime(transactions[selectedTransaction].created_at) }}
            </div>
            <div>
              Cashier: {{ transactions[selectedTransaction].user.name }}
            </div>
            <div
              :class="{
                'text-red-600':
                  transactions[selectedTransaction].payment_status ==
                  statusRefund,
              }"
            >
              Payment Status:
              {{
                statusTransaction.find(
                  (r) =>
                    r.id === transactions[selectedTransaction].payment_status
                )?.name
              }}
            </div>
            <div
              v-if="
                transactions[selectedTransaction].payment_status == statusRefund
              "
              class="text-red-600"
            >
              {{ transactions[selectedTransaction].reason }}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div class="w-full rounded-lg border shadow-sm overflow-x-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead v-if="isRefunded"></TableHead>
                <TableHead class="w-[150px]">Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(transDetail, index) in transactions[selectedTransaction]
                  .details"
              >
                <TableCell v-if="isRefunded">
                  <Checkbox
                    id="terms"
                    :model-value="
                      refundData.details[index]?.product_id ===
                        transDetail.product.id &&
                      refundData.details[index]?.is_refunded
                    "
                    @update:model-value="
                      (value) => {
                        refundData.details[index].is_refunded = value === true;
                        calculateRefund(index, value === true);
                      }
                    "
                  />
                </TableCell>
                <TableCell class="font-medium">
                  {{ transDetail.product.name }}
                </TableCell>
                <TableCell>
                  <div v-if="!isRefunded">{{ transDetail.quantity }}</div>
                  <div v-else>
                    <Input
                      type="number"
                      min="1"
                      :max="transDetail.quantity"
                      v-model="refundData.details[index].quantity"
                      class="text-center"
                      @input="calculateRefund(index)"
                    />
                  </div>
                </TableCell>
                <TableCell>{{ formatPrice(transDetail.price) }}</TableCell>
                <TableCell>
                  <div v-if="!isRefunded">
                    {{ formatPrice(transDetail.subtotal) }}
                  </div>
                  <div v-else class="text-red-600">
                    {{ formatPrice(refundData.details[index].subtotal) }}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div class="space-y-4 text-sm">
          <div class="flex justify-between">
            <div>
              Subtotal:
              {{
                formatPrice(transactions[selectedTransaction].total_subtotal)
              }}
            </div>
            <div class="text-red-600" v-if="isRefunded">
              {{ formatPrice(refundData.subtotal) }}
            </div>
          </div>
          <div
            class="flex justify-between"
            v-if="transactions[selectedTransaction].amount_discount > 0"
          >
            <div>
              Discount:
              {{
                formatPrice(
                  calculateDiscount(
                    Number(transactions[selectedTransaction].total_subtotal),
                    transactions[selectedTransaction].type_discount,
                    Number(transactions[selectedTransaction].amount_discount)
                  )
                )
              }}
            </div>
            <div class="text-red-600" v-if="isRefunded">
              {{ formatPrice(refundData.discount) }}
            </div>
          </div>
          <div
            class="flex justify-between"
            v-if="transactions[selectedTransaction].total_tax > 0"
          >
            <div>
              Tax:
              {{ formatPrice(transactions[selectedTransaction].total_tax) }}
            </div>
            <div class="text-red-600" v-if="isRefunded">
              {{ formatPrice(refundData.total_tax) }}
            </div>
          </div>
          <Separator />
          <div class="flex justify-between">
            <div>
              Total:
              {{ formatPrice(transactions[selectedTransaction].total_price) }}
            </div>
            <div class="text-red-600" v-if="isRefunded">
              {{ formatPrice(refundData.total_price) }}
            </div>
          </div>
          <Separator />
          <div
            v-if="
              !isRefunded &&
              transactions[selectedTransaction].payment_status !== statusRefund
            "
          >
            <div>
              {{
                paymentMethods.find(
                  (r) =>
                    r.id === transactions[selectedTransaction].payment_method
                )?.name
              }}:
              {{ formatPrice(transactions[selectedTransaction].total_payment) }}
            </div>
            <div
              v-if="transactions[selectedTransaction].payment_method === 'cash'"
            >
              Change:
              {{
                formatPrice(
                  calculateChange(
                    Number(transactions[selectedTransaction].total_price),
                    Number(transactions[selectedTransaction].total_payment)
                  )
                )
              }}
            </div>
          </div>
          <div v-if="isRefunded" class="space-y-4">
            <div class="space-y-3">
              <Label>Reason to refund</Label>
              <Select v-model="refundData.type_reason">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="reason in refundReasons"
                      :key="reason.id"
                      :value="reason.id"
                      >{{ reason.name }}</SelectItem
                    >
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div v-if="refundData.type_reason == '3'" class="space-y-3">
              <Label for="reason">Reason Others</Label>
              <Textarea id="reason" v-model="refundData.reason" />
            </div>
            <div v-if="error" class="mt-2 text-red-600">
              {{ error }}
            </div>
          </div>
        </div>
        <DialogFooter :class="{ 'sm:justify-between': isRefunded }">
          <Button type="button" variant="ghost" @click="isModalOpen = false">
            Close
          </Button>
          <Button v-if="isRefunded" type="button" @click="handleRefund">
            <Loader2 v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
            {{ isProcessing ? "Processing..." : "Confirm Refund" }}
          </Button>
        </DialogFooter>
      </DialogScrollContent>
      <DialogContent v-else>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to permanently
            delete this file from our servers?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="sm:justify-between">
          <Button type="button" variant="ghost" @click="isModalOpen = false">
            Cancel
          </Button>
          <Button type="submit" @click="handleDelete">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
