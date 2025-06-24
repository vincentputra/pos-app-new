<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useDate } from "@/composables/useDate";
import { usePrice } from "@/composables/usePrice";
import { useTransactions } from "@/composables/useTransactions";

const { user, initAuth } = useAuth();
const {
  reports,
  grossSalesInfo,
  netSalesInfo,
  fetchReports,
  calculateNetSales,
} = useTransactions();
const { yearNow } = useDate();
const { formatPrice } = usePrice();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedYear = ref(yearNow);
const selectedUser = ref(0);

interface SummaryData {
  month: string;
  grossSales: number;
  discounts: number;
  refunds: number;
  netSales: number;
}

interface transactionData {
  month: string;
  paid: number;
  refunded: number;
}

const summaryChartData = ref<SummaryData[]>([]);
const transactionsChartData = ref<transactionData[]>([]);

const categoriesSummary: Record<string, BulletLegendItemInterface> = {
  grossSales: { name: "Gross Sales", color: "#577a9d" },
  discounts: { name: "Discounts", color: "#a569bd" },
  refunds: { name: "Refunds", color: "#C70039" },
  netSales: { name: "Net Sales", color: "#22c55e" },
};

const categoriesTransaction: Record<string, BulletLegendItemInterface> = {
  paid: { name: "Total Paid", color: "#577a9d" },
  refunded: { name: "Total Refund", color: "#C70039" },
};

function formatMonthChart(dateString: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(dateString));
}

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchReports({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    user_id: selectedUser.value,
    year: selectedYear.value,
    group_by: "month",
  });
  updateSummaryData();
};

const filterByYear = async (payload: any) => {
  selectedYear.value = Number(payload);
  await handlePageChange(1);
};

const salesSummary = ref<
  {
    label: string;
    amount: number;
    type: number;
  }[]
>([
  {
    label: "Gross Sales",
    amount: 0,
    type: 0,
  },
  {
    label: "Discounts",
    amount: 0,
    type: 0,
  },
  {
    label: "Refunds",
    amount: 0,
    type: 0,
  },
  {
    label: "Net Sales",
    amount: 0,
    type: 0,
  },
  {
    label: "Paid Transactions",
    amount: 0,
    type: 1,
  },
  {
    label: "Refund Transactions",
    amount: 0,
    type: 1,
  },
]);

const updateSummaryData = async () => {
  summaryChartData.value = [];
  transactionsChartData.value = [];

  let totalGrossSales = 0;
  let totalDiscounts = 0;
  let totalRefunds = 0;
  let totalNetSales = 0;
  let totalPaidTransactions = 0;
  let totalRefundTransactions = 0;

  reports.value.reverse().forEach((report) => {
    report.netSales = calculateNetSales(
      report.paid["subtotal"],
      report.refunded["subtotal"],
      report.paid["discount"] - report.refunded["discount"]
    );

    totalGrossSales += report.paid["subtotal"];
    totalDiscounts += report.paid["discount"] - report.refunded["discount"];
    totalRefunds += report.refunded["subtotal"];
    totalNetSales += report.netSales;
    totalPaidTransactions += report.paid_transactions;
    totalRefundTransactions += report.refunded_transactions;

    summaryChartData.value.push({
      month: formatMonthChart(new Date(report.date)),
      grossSales: report.paid["subtotal"],
      discounts: report.paid["discount"] - report.refunded["discount"],
      refunds: report.refunded["subtotal"],
      netSales: report.netSales,
    });

    transactionsChartData.value.push({
      month: formatMonthChart(new Date(report.date)),
      paid: report.paid_transactions,
      refunded: report.refunded_transactions,
    });
  });

  salesSummary.value[0].amount = totalGrossSales;
  salesSummary.value[1].amount = totalDiscounts;
  salesSummary.value[2].amount = totalRefunds;
  salesSummary.value[3].amount = totalNetSales;
  salesSummary.value[4].amount = totalPaidTransactions;
  salesSummary.value[5].amount = totalRefundTransactions;
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
  <div class="flex flex-1 flex-col w-[calc(100%-200px)] gap-4 p-4">
    <div class="sm:flex items-center gap-4">
      <FilterByYear @year-change="filterByYear" />
    </div>
    <div class="grid auto-rows-min gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <UCard v-for="sales in salesSummary">
        <p class="mb-1 text-(--ui-text-dimmed)">{{ sales.label }}</p>
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-medium">
            {{ sales.type === 0 ? formatPrice(sales.amount) : sales.amount }}
          </h2>
        </div>
      </UCard>
    </div>
    <div class="grid auto-rows-min gap-4 xl:grid-cols-2">
      <UCard class="!bg-(--ui-bg)">
        <template #header>
          <div>
            <h2 class="text-lg font-medium">
              Summary Sales ({{ selectedYear }})
            </h2>
            <p class="text-sm text-(--ui-text-muted)">{{ grossSalesInfo }}</p>
            <p class="text-sm text-(--ui-text-muted)">{{ netSalesInfo }}</p>
          </div>
        </template>

        <LineChart
          :data="summaryChartData"
          :height="220"
          :categories="categoriesSummary"
          :y-grid-line="true"
          :x-formatter="(i) => `${summaryChartData[i]?.month}`"
          :y-formatter="(i: number) => `${formatPrice(i)}`"
          :x-num-ticks="summaryChartData.length - 1"
          :y-num-ticks="summaryChartData.length"
          :curve-type="CurveType.MonotoneX"
          :legend-position="LegendPosition.Bottom"
        />
      </UCard>
      <UCard class="!bg-(--ui-bg)">
        <template #header>
          <div>
            <h2 class="text-lg font-medium">
              Total Transactions ({{ selectedYear }})
              <p class="text-sm text-(--ui-text-muted)">
                Total Paid are the total number of transactions where a payment
                was made and processed successfully.
              </p>
              <p class="text-sm text-(--ui-text-muted)">
                Total Refund are the total number of transactions where a
                payment was refunded.
              </p>
            </h2>
          </div>
        </template>

        <LineChart
          :data="transactionsChartData"
          :height="220"
          :categories="categoriesTransaction"
          :y-grid-line="true"
          :x-formatter="(i) => `${transactionsChartData[i]?.month}`"
          :y-formatter="(i: number) => `${i}`"
          :x-num-ticks="transactionsChartData.length - 1"
          :y-num-ticks="transactionsChartData.length"
          :curve-type="CurveType.MonotoneX"
          :legend-position="LegendPosition.Bottom"
        />
      </UCard>
    </div>
  </div>
</template>
