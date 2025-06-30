<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  reportsTotal,
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
const selectedTransaction = ref(0);
const isModalOpen = ref(false);

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

const totalSoldQuantity = (products: any[]) => {
  return products.reduce(
    (sum, product) => sum + Number(product.sold_quantity || 0),
    0
  );
};

const totalRefundedQuantity = (products: any[]) => {
  return products.reduce(
    (sum, product) => sum + Number(product.refunded_quantity || 0),
    0
  );
};

const openProductModal = async (id: number) => {
  selectedTransaction.value = id;
  isModalOpen.value = true;
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
  <div class="flex h-full w-full flex-1 flex-col overflow-hidden">
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
      <div class="sm:flex items-center gap-4">
        <FilterByCashier @user-change="filterByUser" v-if="user?.role !== 1" />
        <FilterByDate @date-change="filterByDate" />
      </div>
      <Tabs default-value="sales-summary">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="sales-summary"> Sales Summary </TabsTrigger>
          <TabsTrigger value="payment-method"> Payment Methods </TabsTrigger>
        </TabsList>
        <TabsContent value="sales-summary">
          <div
            class="grid auto-rows-min gap-4 lg:grid-cols-2 xl:grid-cols-3 mb-4"
          >
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">Total Gross Sales</p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{
                    formatPrice((reportsTotal as any)?.sum_paid_subtotal || 0)
                  }}
                </h2>
              </div>
            </UCard>
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">Total Refunds</p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{
                    formatPrice(
                      (reportsTotal as any)?.sum_refunded_subtotal || 0
                    )
                  }}
                </h2>
              </div>
            </UCard>
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">Total Discounts</p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{
                    formatPrice(
                      (reportsTotal as any)?.sum_paid_discount -
                        (reportsTotal as any)?.sum_refunded_discount
                    )
                  }}
                </h2>
              </div>
            </UCard>
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">Total Net Sales</p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{
                    formatPrice(
                      calculateNetSales(
                        (reportsTotal as any)?.sum_paid_subtotal || 0,
                        (reportsTotal as any)?.sum_refunded_subtotal || 0,
                        (reportsTotal as any)?.sum_paid_discount -
                          (reportsTotal as any)?.sum_refunded_discount
                      )
                    )
                  }}
                </h2>
              </div>
            </UCard>
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">
                Total Paid Transactions
              </p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{ (reportsTotal as any)?.paid_count || 0 }}
                </h2>
              </div>
            </UCard>
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">
                Total Refunded Transactions
              </p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{ (reportsTotal as any)?.refunded_count || 0 }}
                </h2>
              </div>
            </UCard>
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
                <template v-else-if="reports.length">
                  <TableRow v-for="(trans, index) in reports" :key="trans.id">
                    <TableCell>{{ formatDate(trans.trans_date) }}</TableCell>
                    <TableCell>{{
                      formatPrice(trans.sum_paid_subtotal)
                    }}</TableCell>
                    <TableCell>{{
                      formatPrice(trans.sum_refunded_subtotal)
                    }}</TableCell>
                    <TableCell>{{
                      formatPrice(
                        trans.sum_paid_discount - trans.sum_refunded_discount
                      )
                    }}</TableCell>
                    <TableCell>{{
                      formatPrice(
                        calculateNetSales(
                          trans.sum_paid_subtotal,
                          trans.sum_refunded_subtotal,
                          trans.sum_paid_discount - trans.sum_refunded_discount
                        )
                      )
                    }}</TableCell>
                    <TableCell>{{ trans.paid_count }}</TableCell>
                    <TableCell>{{ trans.refunded_count }}</TableCell>
                    <TableCell>
                      <div class="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          @click="openProductModal(index)"
                        >
                          Products
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="payment-method">
          <div
            class="grid auto-rows-min gap-4 lg:grid-cols-2 xl:grid-cols-3 mb-4"
          >
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">Total Tendered</p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{
                    formatPrice(
                      (reportsTotal as any)?.sum_paid_price -
                        (reportsTotal as any)?.sum_refunded_price
                    )
                  }}
                </h2>
              </div>
            </UCard>
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">Total Paid</p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{
                    formatPrice(
                      (reportsTotal as any)?.sum_bank_transfer_payment -
                        (reportsTotal as any)?.sum_bank_transfer_refunded
                    )
                  }}
                </h2>
              </div>
            </UCard>
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">Total E-Wallet</p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{
                    formatPrice(
                      (reportsTotal as any)?.sum_ewallet_payment -
                        (reportsTotal as any)?.sum_ewallet_refunded
                    )
                  }}
                </h2>
              </div>
            </UCard>
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">Total QRIS</p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{
                    formatPrice(
                      (reportsTotal as any)?.sum_qris_payment -
                        (reportsTotal as any)?.sum_qris_refunded
                    )
                  }}
                </h2>
              </div>
            </UCard>
            <UCard>
              <p class="mb-1 text-(--ui-text-dimmed)">Total Cash</p>
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-medium">
                  {{
                    formatPrice(
                      (reportsTotal as any)?.sum_cash_payment -
                        (reportsTotal as any)?.sum_cash_refunded
                    )
                  }}
                </h2>
              </div>
            </UCard>
          </div>
          <div class="rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Tendered</TableHead>
                  <TableHead>Bank Transfer</TableHead>
                  <TableHead>E-Wallet</TableHead>
                  <TableHead>QRIS</TableHead>
                  <TableHead>Cash</TableHead>
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
                    <TableCell>{{ formatDate(trans.trans_date) }}</TableCell>
                    <TableCell>{{
                      formatPrice(
                        (trans?.sum_paid_price || 0) -
                          (trans?.sum_refunded_price || 0)
                      )
                    }}</TableCell>
                    <TableCell>{{
                      formatPrice(
                        (trans?.sum_bank_transfer_payment || 0) -
                          (trans?.sum_bank_transfer_refunded || 0)
                      )
                    }}</TableCell>
                    <TableCell>{{
                      formatPrice(
                        (trans?.sum_ewallet_payment || 0) -
                          (trans?.sum_ewallet_refunded || 0)
                      )
                    }}</TableCell>
                    <TableCell>{{
                      formatPrice(
                        (trans?.sum_qris_payment || 0) -
                          (trans?.sum_qris_refunded || 0)
                      )
                    }}</TableCell>
                    <TableCell>{{
                      formatPrice(
                        (trans?.sum_cash_payment || 0) -
                          (trans?.sum_cash_refunded || 0)
                      )
                    }}</TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

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

    <!-- Detail Modal -->
    <Dialog :open="isModalOpen" @update:open="isModalOpen = false">
      <DialogScrollContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle class="mb-4">Sales Report</DialogTitle>
          <DialogDescription class="font-medium text-gray-800 space-y-2">
            <div>
              Date:
              {{ formatDate(reports[selectedTransaction].trans_date) }}
            </div>
            <div>
              Gross Sales:
              {{ formatPrice(reports[selectedTransaction].sum_paid_subtotal) }}
            </div>
            <div>
              Refunds:
              {{
                formatPrice(reports[selectedTransaction].sum_refunded_subtotal)
              }}
            </div>
            <div>
              Discounts:
              {{
                formatPrice(
                  reports[selectedTransaction].sum_paid_discount -
                    reports[selectedTransaction].sum_refunded_discount
                )
              }}
            </div>
            <div>
              Net Sales:
              {{
                formatPrice(
                  calculateNetSales(
                    reports[selectedTransaction].sum_paid_subtotal,
                    reports[selectedTransaction].sum_refunded_subtotal,
                    reports[selectedTransaction].sum_paid_discount -
                      reports[selectedTransaction].sum_refunded_discount
                  )
                )
              }}
            </div>
            <div>
              Paid Transactions:
              {{ reports[selectedTransaction].paid_count }}
            </div>
            <div>
              Refunded Transactions:
              {{ reports[selectedTransaction].refunded_count }}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div class="rounded-lg border shadow-sm">
          <Table v-if="reports[selectedTransaction].products.length > 0">
            <TableHeader>
              <TableRow>
                <TableHead class="w-[150px]">Product</TableHead>
                <TableHead>Sold Quantity</TableHead>
                <TableHead>Refunded Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="product in reports[selectedTransaction].products"
              >
                <TableCell>{{ product.name }}</TableCell>
                <TableCell>{{ product.sold_quantity }}</TableCell>
                <TableCell>{{ product.refunded_quantity }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div class="text-sm font-medium text-gray-800">
          Total Sold Quantity:
          {{ totalSoldQuantity(reports[selectedTransaction].products) }}
        </div>
        <div class="text-sm font-medium text-gray-800">
          Total Refunded Quantity:
          {{ totalRefundedQuantity(reports[selectedTransaction].products) }}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" @click="isModalOpen = false">
            Close
          </Button>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>
  </div>
</template>
