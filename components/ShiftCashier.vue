<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const emit = defineEmits(["open-shift"]);
const isShiftModalOpen = ref(false);
const form = reactive({
  amount: 100000,
});

const openShiftModal = () => {
  isShiftModalOpen.value = true;
};

const handleSubmitShift = async () => {
  emit("open-shift", {
    cash_balance: form.amount,
    expected_cash_balance: form.amount,
    final_cash_balance: 0,
  });
  isShiftModalOpen.value = false;
};
</script>

<template>
  <div class="flex flex-1 flex-col">
    <div class="flex h-full items-center justify-center p-6">
      <div class="text-center">
        <div class="mb-4">
          <div class="mx-auto h-24 w-24 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-hourglass-icon lucide-hourglass"
            >
              <path d="M5 22h14" />
              <path d="M5 2h14" />
              <path
                d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"
              />
              <path
                d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"
              />
            </svg>
          </div>
        </div>
        <h2 class="mb-2 text-2xl font-semibold text-gray-700">
          Shift is closed
        </h2>
        <p class="mb-4 text-gray-500">Open a shift to perform sales</p>
        <Button @click="openShiftModal">Open Shift</Button>
      </div>
    </div>
  </div>

  <!-- Shift Modal -->
  <Dialog :open="isShiftModalOpen" @update:open="isShiftModalOpen = false">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Open New Shift</DialogTitle>
        <DialogDescription>
          Specify the initial cash balance for the shift. This will allow you to
          start processing sales.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="handleSubmitShift" class="space-y-4">
        <div class="space-y-2">
          <NumberField
            id="amount"
            v-model="form.amount"
            :default-value="100000"
            :format-options="{
              style: 'currency',
              currency: 'IDR',
              currencyDisplay: 'code',
              currencySign: 'accounting',
            }"
          >
            <Label for="amount">Amount</Label>
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
          <Button type="submit">Open Shift</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
