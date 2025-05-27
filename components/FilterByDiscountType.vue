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
import { useDiscounts } from "@/composables/useDiscounts";

const { typeDiscount } = useDiscounts();
const selectedDiscountType = ref("0");

const emit = defineEmits<{
  (e: "type-change", role: number): void;
}>();

watch(selectedDiscountType, (newValue) => {
  emit("type-change", Number(newValue));
});
</script>

<template>
  <Select v-model="selectedDiscountType">
    <SelectTrigger class="w-[180px]">
      <SelectValue placeholder="Select a role" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem value="0">All of the type</SelectItem>
        <SelectItem
          v-for="type in typeDiscount"
          :key="type.id"
          :value="type.id"
          >{{ type.name }}</SelectItem
        >
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
