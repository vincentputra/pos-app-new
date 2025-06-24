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

const { statusTransaction } = useTransactions();
const selectedStatusTrans = ref("all");

const emit = defineEmits<{
  (e: "status-change", status: string): void;
}>();

watch(selectedStatusTrans, (newValue) => {
  emit("status-change", newValue);
});
</script>

<template>
  <Select v-model="selectedStatusTrans">
    <SelectTrigger class="w-full md:w-[180px] mb-4">
      <SelectValue placeholder="Select a status" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem value="all">All of the status</SelectItem>
        <SelectItem
          v-for="status in statusTransaction"
          :key="status.id"
          :value="status.id"
          >{{ status.name }}</SelectItem
        >
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
