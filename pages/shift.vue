<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "vue-sonner";
import { BookPlus, UserLock } from "lucide-vue-next";
import { useShifts } from "@/composables/useShifts";
import { usePrice } from "@/composables/usePrice";
import { useDate } from "@/composables/useDate";

const {
  shiftUser,
  isTheShiftOpen,
  error,
  initShiftUser,
  openShift,
  closeShift,
} = useShifts();
const { formatPrice } = usePrice();
const { formatDateTime } = useDate();

const isShiftModalOpen = ref(false);
const form = reactive({
  amount: 0,
});
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
    title: "Cash Changes",
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
]);

onMounted(async () => {
  nextTick(async () => {
    await initShiftUser();
    cashReport.value[0].balance = shiftUser.value?.cash_balance ?? 0;
    cashReport.value[1].balance = shiftUser.value?.cash_payments ?? 0;
    cashReport.value[2].balance = shiftUser.value?.cash_changes ?? 0;
    cashReport.value[3].balance = shiftUser.value?.cash_refunds ?? 0;
    cashReport.value[4].balance = shiftUser.value?.paid_in ?? 0;
    cashReport.value[5].balance = shiftUser.value?.paid_out ?? 0;
    cashReport.value[6].balance = shiftUser.value?.expected_cash_balance ?? 0;
    salesSummary.value[0].balance = shiftUser.value?.gross_sales ?? 0;
    salesSummary.value[1].balance = shiftUser.value?.refunds ?? 0;
    salesSummary.value[2].balance = shiftUser.value?.discounts ?? 0;
    salesSummary.value[3].balance = shiftUser.value?.net_sales ?? 0;
    form.amount = Number(shiftUser.value?.expected_cash_balance) ?? 0;
  });
});

const openShiftModal = () => {
  isShiftModalOpen.value = true;
};

const handleOpenShift = async (payload: any) => {
  await openShift(payload);

  if (error.value) {
    toast.error(error.value ?? "Something went wrong");
    return;
  }

  toast.success("Open shift successfully");
};

const handleSubmitShift = async () => {
  await closeShift({
    final_cash_balance: form.amount,
  });

  if (error.value) {
    toast.error(error.value ?? "Something went wrong");
    return;
  }

  toast.success("Close shift successfully");
  isShiftModalOpen.value = false;
};

definePageMeta({
  layout: "authenticated",
  middleware: ["auth"],
});
</script>

<template>
  <div class="flex h-full w-full flex-1 flex-col">
    <ShiftCashier v-if="!isTheShiftOpen" @open-shift="handleOpenShift" />

    <div v-else>
      <header class="flex-none border-b border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-semibold text-gray-800">
            Shift {{ shiftUser?.user.name }}
          </h1>
          <div class="flex items-center gap-2">
            <NuxtLink to="/cash-management">
              <Button type="button" variant="ghost" size="sm">
                <BookPlus class="mr-2 h-4 w-4" />
                Cash Management
              </Button>
            </NuxtLink>
            <Button type="button" size="sm" @click="openShiftModal">
              <UserLock class="mr-2 h-4 w-4" />
              Close Shift
            </Button>
          </div>
        </div>
      </header>
      <div class="min-h-0 flex-1 p-4">
        <div class="space-y-1">
          <p class="text-lg font-medium mb-4">
            Open Shift at
            {{ formatDateTime(shiftUser?.created_at ?? new Date()) }}
          </p>
          <p v-if="shiftUser?.updated_at" class="text-lg font-medium mb-4">
            Closed Shift at
            {{ formatDateTime(new Date(shiftUser?.updated_at ?? new Date())) }}
          </p>
        </div>
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
      </div>

      <!-- Shift Modal -->
      <Dialog :open="isShiftModalOpen" @update:open="isShiftModalOpen = false">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Shift</DialogTitle>
            <DialogDescription>
              Expected Cash Amount:
              <span class="ml-2 font-medium text-gray-800">
                {{ formatPrice(cashReport[5].balance) }}
              </span>
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="handleSubmitShift" class="space-y-4">
            <div class="space-y-2">
              <NumberField
                id="amount"
                v-model="form.amount"
                :min="0"
                :step="1000"
                :format-options="{
                  style: 'currency',
                  currency: 'IDR',
                  currencyDisplay: 'code',
                  currencySign: 'accounting',
                }"
              >
                <Label for="amount">Actual Cash Amount</Label>
                <NumberFieldContent>
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldContent>
              </NumberField>
            </div>
            <DialogFooter class="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                @click="isShiftModalOpen = false"
                >Cancel</Button
              >
              <Button type="submit">Close Shift</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
