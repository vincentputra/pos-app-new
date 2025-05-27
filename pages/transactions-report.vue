<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { Button } from "@/components/ui/button";
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
import { RefreshCcw } from "lucide-vue-next";
import { toast } from "vue-sonner";
const { user, initAuth } = useAuth();
import { useTransactions } from "@/composables/useTransactions";
import { usePrice } from "@/composables/usePrice";
import { useDate } from "@/composables/useDate";

const {
  transactions,
  pageTransaction,
  statusTransaction,
  paymentMethods,
  isLoading,
  error,
  fetchTransactions,
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
const selectedUser = ref(0);
const search = ref("");
const selectedTransaction = ref(0);
const isModalOpen = ref(false);
const isRefunded = ref(false);
const isDeleted = ref(false);
const editingId = ref<number | null>(null);

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchTransactions({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    status: selectedStatus.value,
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

const openRefundModal = (id: number) => {
  isDeleted.value = false;
  isRefunded.value = true;
  selectedTransaction.value = id;
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
          Transactions Report
        </h1>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="
              fetchTransactions({
                page: currentPage,
                per_page: itemsPerPage,
                status: selectedStatus,
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
      <div class="mb-4 flex items-center gap-4">
        <FilterByCashier @user-change="filterByUser" v-if="user?.role !== 1" />
        <FilterByStatusTrans @status-change="filterByStatus" />
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
                <TableCell>{{ formatDateTime(trans.date) }}</TableCell>
                <TableCell>{{ formatPrice(trans.total_price) }}</TableCell>
                <TableCell
                  :class="
                    trans.payment_status === 'refunded' ? 'text-red-600' : ''
                  "
                  >{{
                    statusTransaction.find((r) => r.id === trans.payment_status)
                      ?.name
                  }}</TableCell
                >
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
                      v-else
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
      <DialogContent v-if="!isDeleted">
        <DialogHeader>
          <DialogTitle>
            {{
              formatNoReceipt({
                id: transactions[selectedTransaction].id,
                date: transactions[selectedTransaction].date,
                user: transactions[selectedTransaction].user.id,
              })
            }}
          </DialogTitle>
          <DialogDescription class="font-medium text-gray-800">
            <div>
              Receipt Date:
              {{ formatDateTime(transactions[selectedTransaction].date) }}
            </div>
            <div>
              Cashier: {{ transactions[selectedTransaction].user.name }}
            </div>
            <div>
              Payment Status:
              {{
                statusTransaction.find(
                  (r) =>
                    r.id === transactions[selectedTransaction].payment_status
                )?.name
              }}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div class="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[150px]">Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="transDetail in transactions[selectedTransaction].details"
              >
                <TableCell class="font-medium">
                  {{ transDetail.product.name }}
                </TableCell>
                <TableCell>{{ transDetail.quantity }}</TableCell>
                <TableCell>{{ formatPrice(transDetail.price) }}</TableCell>
                <TableCell>{{ formatPrice(transDetail.subtotal) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          Subtotal:
          {{ formatPrice(transactions[selectedTransaction].total_subtotal) }}
        </div>
        <div v-if="transactions[selectedTransaction].amount_discount > 0">
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
        <div v-if="transactions[selectedTransaction].total_tax > 0">
          Tax:
          {{ formatPrice(transactions[selectedTransaction].total_tax) }}
        </div>
        <Separator class="my-1" />
        <div>
          Total:
          {{ formatPrice(transactions[selectedTransaction].total_price) }}
        </div>
        <Separator class="my-1" />
        <div>
          {{
            paymentMethods.find(
              (r) => r.id === transactions[selectedTransaction].payment_method
            )?.name
          }}:
          {{ formatPrice(transactions[selectedTransaction].total_payment) }}
        </div>
        <div v-if="transactions[selectedTransaction].payment_method === 'cash'">
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
        <DialogFooter>
          <Button type="button" variant="ghost" @click="isModalOpen = false">
            Close
          </Button>
        </DialogFooter>
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
          <Button type="button" variant="ghost" @click="isModalOpen = false">
            Cancel
          </Button>
          <Button type="submit" @click="handleDelete">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
