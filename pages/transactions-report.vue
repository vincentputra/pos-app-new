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
import { useTransactions } from "@/composables/useTransactions";
import { usePrice } from "@/composables/usePrice";
import { useDate } from "@/composables/useDate";

const {
  transactions,
  pageTransaction,
  statusTransaction,
  isLoading,
  fetchTransactions,
} = useTransactions();
const { formatPrice } = usePrice();
const { dateRange, formatDateTime } = useDate();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedStatus = ref("");
const selectedUser = ref(0);
const search = ref("all");
const selectedTransaction = ref(0);

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
    await handlePageChange(1);
  });
});

const isModalOpen = ref(false);

const openDetailModal = async (id: number) => {
  selectedTransaction.value = id;
  isModalOpen.value = true;
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
        <FilterByCashier @user-change="filterByUser" />
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
                <TableCell>#{{ trans.id }}</TableCell>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle
            ># {{ transactions[selectedTransaction].id }}</DialogTitle
          >
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
          Total:
          {{ formatPrice(transactions[selectedTransaction].total_price) }}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" @click="isModalOpen = false"
            >Close</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
