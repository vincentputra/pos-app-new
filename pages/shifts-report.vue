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
import { useShifts } from "@/composables/useShifts";
import { usePrice } from "@/composables/usePrice";
import { useDate } from "@/composables/useDate";

const {
  shifts,
  shiftDetail,
  pageShift,
  isLoading,
  fetchShifts,
  fetchShiftDetail,
} = useShifts();
const { formatPrice } = usePrice();
const { dateRange, formatDateTime } = useDate();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedUser = ref(0);
const isModalOpen = ref(false);

const cashReport = ref([
  {
    title: "Starting Cash",
    balance: 0,
  },
  {
    title: "Cash Payments",
    balance: 0,
  },
  {
    title: "Cash Refunds",
    balance: 0,
  },
  {
    title: "Paid In",
    balance: 0,
  },
  {
    title: "Paid Out",
    balance: 0,
  },
  {
    title: "Expected Cash",
    balance: 0,
  },
  {
    title: "Actual Cash",
    balance: 0,
  },
  {
    title: "Difference Cash",
    balance: 0,
  },
]);
const salesSummary = ref([
  {
    title: "Gross Sales",
    balance: 0,
  },
  {
    title: "Refunds",
    balance: 0,
  },
  {
    title: "Discounts",
    balance: 0,
  },
  {
    title: "Net Sales",
    balance: 0,
  },
  {
    title: "Tax Sales",
    balance: 0,
  },
]);

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchShifts({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    user_id: selectedUser.value,
    date_range: dateRange.value,
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

const filterByDate = async (payload: any) => {
  dateRange.value = payload;
  await handlePageChange(1);
};

const openDetailModal = async (id: number) => {
  await fetchShiftDetail({ id: id });
  cashReport.value[0].balance = shiftDetail.value?.cash_balance ?? 0;
  cashReport.value[1].balance = shiftDetail.value?.cash_payments ?? 0;
  cashReport.value[2].balance = shiftDetail.value?.cash_refunds ?? 0;
  cashReport.value[3].balance = shiftDetail.value?.paid_in ?? 0;
  cashReport.value[4].balance = shiftDetail.value?.paid_out ?? 0;
  cashReport.value[5].balance = shiftDetail.value?.expected_cash_balance ?? 0;
  cashReport.value[6].balance = shiftDetail.value?.final_cash_balance ?? 0;
  const difference = cashReport.value[6].balance - cashReport.value[5].balance;
  cashReport.value[7].balance = difference;
  salesSummary.value[0].balance = shiftDetail.value?.gross_sales ?? 0;
  salesSummary.value[1].balance = shiftDetail.value?.refunds ?? 0;
  salesSummary.value[2].balance = shiftDetail.value?.discounts ?? 0;
  salesSummary.value[3].balance = shiftDetail.value?.net_sales ?? 0;
  salesSummary.value[4].balance = shiftDetail.value?.tax_sales ?? 0;
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
        <h1 class="text-2xl font-semibold text-gray-800">Shifts Report</h1>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="
              fetchShifts({
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
        <FilterByCashier @user-change="filterByUser" />
        <FilterByDate @date-change="filterByDate" />
      </div>
      <div class="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Opening Time</TableHead>
              <TableHead>Closing Time</TableHead>
              <TableHead>Expected Cash Amount</TableHead>
              <TableHead>Actual Cash Amount</TableHead>
              <TableHead>Difference Cash Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="isLoading">
              <TableRow v-for="n in pageShift.total ?? 5" :key="n">
                <TableCell v-for="m in 5" :key="m">
                  <div class="h-4 w-24 animate-pulse rounded bg-gray-100" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else-if="shifts.length">
              <TableRow v-for="shift in shifts" :key="shift.id">
                <TableCell>{{ shift.user.name }}</TableCell>
                <TableCell>{{ formatDateTime(shift.created_at) }}</TableCell>
                <TableCell>{{ formatDateTime(shift.updated_at) }}</TableCell>
                <TableCell>{{
                  formatPrice(shift.expected_cash_balance)
                }}</TableCell>
                <TableCell>{{
                  formatPrice(shift.final_cash_balance)
                }}</TableCell>
                <TableCell
                  :class="{
                    'text-red-600':
                      shift.final_cash_balance - shift.expected_cash_balance <
                      0,
                  }"
                >
                  {{
                    formatPrice(
                      shift.final_cash_balance - shift.expected_cash_balance
                    )
                  }}
                </TableCell>
                <TableCell>
                  <div class="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      @click="openDetailModal(shift.id)"
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
        :total="pageShift.total"
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="mb-4">Shift Report</DialogTitle>
          <DialogDescription class="font-medium text-gray-800 space-y-2">
            <div>
              Cashier:
              {{ shiftDetail?.user?.name ?? "N/A" }}
            </div>
            <div>
              Open Shift:
              {{ formatDateTime(shiftDetail?.created_at ?? new Date()) }}
            </div>
            <div v-if="shiftDetail?.updated_at">
              Closed Shift:
              {{ formatDateTime(shiftDetail?.updated_at ?? new Date()) }}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div class="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[150px]">Cash Drawer</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="cash in cashReport">
                <TableCell class="font-medium">
                  {{ cash.title }}
                </TableCell>
                <TableCell>{{ formatPrice(cash.balance) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Table class="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead class="w-[150px]">Sales Summary</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="cash in salesSummary">
                <TableCell class="font-medium">
                  {{ cash.title }}
                </TableCell>
                <TableCell>{{ formatPrice(cash.balance) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" @click="isModalOpen = false">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
