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
import { BookPlus } from "lucide-vue-next";
import { useShifts } from "@/composables/useShifts";
import { usePrice } from "@/composables/usePrice";
import { useDate } from "@/composables/useDate";

const {
  shiftUser,
  shiftHistories,
  typeCash,
  error,
  initShiftUser,
  createShiftHistory,
  fetchShiftHistories,
} = useShifts();
const { formatPrice } = usePrice();
const { formatDateTime } = useDate();

const isModalOpen = ref(false);
const form = reactive({
  amount: 0,
  desc: "",
});

onMounted(async () => {
  nextTick(async () => {
    await initShiftUser();
    await fetchShiftHistories();
  });
});

const openShiftModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const resetForm = () => {
  form.amount = 0;
  form.desc = "";
};

const handleSubmitCash = async (type: number) => {
  await createShiftHistory({
    description: form.desc,
    amount: form.amount,
    type: type,
  });

  if (error.value) {
    toast.error(error.value ?? "Something went wrong");
    return;
  }

  if (type === 0) {
    toast.success("Pay-in added successfully");
  } else {
    toast.success("Pay-out added successfully");
  }
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
        <h1 class="text-2xl font-semibold text-gray-800">Cash Management</h1>
        <div class="flex items-center gap-2">
          <Button type="button" size="sm" @click="openShiftModal">
            <BookPlus class="mr-2 h-4 w-4" />
            Add Cash Report
          </Button>
        </div>
      </div>
    </header>
    <div class="custom-scrollbar min-h-0 flex-1 p-4">
      <div class="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[150px]">Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="cash in shiftHistories" :key="cash.id">
              <TableCell class="font-medium">{{
                typeCash.find((r) => r.id === cash.type)?.name
              }}</TableCell>
              <TableCell>
                {{ cash.description }}
              </TableCell>
              <TableCell>{{ formatPrice(cash.amount) }}</TableCell>
              <TableCell>{{ formatDateTime(cash.created_at) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Shift Modal -->
    <Dialog :open="isModalOpen" @update:open="isModalOpen = false">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Cash Report</DialogTitle>
          <DialogDescription>
            Pay-in for the cash will be added to the starting cash balance.<br />
            Pay-out for the cash will be subtracted from the starting cash
            balance.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-2">
          <NumberField
            id="amount"
            v-model="form.amount"
            :default-value="1"
            :format-options="{
              style: 'currency',
              currency: 'IDR',
              currencyDisplay: 'code',
              currencySign: 'accounting',
            }"
          >
            <Label for="amount">Cash Amount</Label>
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
        <div class="space-y-2">
          <Label for="desc">Description</Label>
          <Input id="desc" v-model="form.desc" required />
        </div>
        <DialogFooter class="sm:justify-between">
          <Button type="button" variant="ghost" @click="closeModal"
            >Cancel</Button
          >
          <Button
            type="submit"
            variant="destructive"
            @click="handleSubmitCash(1)"
            >Pay-out</Button
          >
          <Button type="submit" @click="handleSubmitCash(0)">Pay-in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
