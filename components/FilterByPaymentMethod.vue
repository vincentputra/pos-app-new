<script setup lang="ts">
import { watch } from "vue";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactions } from "@/composables/useTransactions";

const { paymentMethods } = useTransactions();
const selectedPaymentMethod = ref("all");

const emit = defineEmits<{
  (e: "method-change", method: string): void;
}>();

watch(selectedPaymentMethod, (newValue) => {
  emit("method-change", newValue);
});
</script>

<template>
  <Select v-model="selectedPaymentMethod">
    <SelectTrigger class="w-[180px]">
      <SelectValue placeholder="Select a payment method" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem value="all">All of the payment method</SelectItem>
        <SelectItem
          v-for="method in paymentMethods"
          :key="method.id"
          :value="method.id"
          >{{ method.name }}</SelectItem
        >
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
