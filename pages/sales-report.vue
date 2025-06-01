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
import { RefreshCcw, Info } from "lucide-vue-next";
import { useAuth } from "@/composables/useAuth";
import { useTransactions } from "@/composables/useTransactions";
import { usePrice } from "@/composables/usePrice";
import { useDate } from "@/composables/useDate";

const { user, initAuth } = useAuth();
const {
  reports,
  pageTransaction,
  grossSalesInfo,
  netSalesInfo,
  isLoading,
  fetchReports,
  calculateNetSales,
} = useTransactions();
const { formatPrice } = usePrice();
const { dateRange, formatDate } = useDate();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedUser = ref(0);

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchReports({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    user_id: selectedUser.value,
    date_range: dateRange.value,
  });
};

const filterByUser = async (payload: any) => {
  selectedUser.value = Number(payload);
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

definePageMeta({
  layout: "authenticated",
  middleware: ["auth"],
});
</script>

<template>
  <div class="flex h-full w-full flex-1 flex-col">
    <header class="flex-none border-b border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-800">Sales Report</h1>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="
              fetchReports({
                page: currentPage,
                per_page: itemsPerPage,
                user_id: selectedUser,
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
        <FilterByDate @date-change="filterByDate" />
      </div>
      <div class="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead class="flex items-center">
                Gross Sales
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Info class="w-4 h-4 ml-2" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {{ grossSalesInfo }}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead>Refunds</TableHead>
              <TableHead>Discounts</TableHead>
              <TableHead class="flex items-center">
                Net Sales
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Info class="w-4 h-4 ml-2" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {{ netSalesInfo }}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead>Paid Transactions</TableHead>
              <TableHead>Refunded Transactions</TableHead>
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
            <template v-else-if="reports.length">
              <TableRow v-for="trans in reports" :key="trans.id">
                <TableCell>{{ formatDate(trans.date) }}</TableCell>
                <TableCell>{{ formatPrice(trans.paid["subtotal"]) }}</TableCell>
                <TableCell>{{
                  formatPrice(trans.refunded["subtotal"])
                }}</TableCell>
                <TableCell>{{
                  formatPrice(
                    trans.paid["discount"] - trans.refunded["discount"]
                  )
                }}</TableCell>
                <TableCell>{{
                  formatPrice(
                    calculateNetSales(
                      trans.paid["subtotal"],
                      trans.refunded["subtotal"],
                      trans.paid["discount"] - trans.refunded["discount"]
                    )
                  )
                }}</TableCell>
                <TableCell>{{ trans.paid_transactions }}</TableCell>
                <TableCell>{{ trans.refunded_transactions }}</TableCell>
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
  </div>
</template>
