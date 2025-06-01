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
import { useDate } from "@/composables/useDate";

const { yearNow } = useDate();
const selectedYear = ref(yearNow);
const allYears = computed(() => {
  const years: number[] = [];
  for (let i = Number(yearNow); i >= 1945; i--) {
    years.push(i);
  }
  return years;
});

const emit = defineEmits<{
  (e: "year-change", year: number): void;
}>();

watch(selectedYear, (newValue) => {
  emit("year-change", newValue);
});
</script>

<template>
  <Select v-model="selectedYear">
    <SelectTrigger class="w-[180px]">
      <SelectValue placeholder="Select a year" />
    </SelectTrigger>
    <SelectContent class="h-[300px]" position="popper" :side-offset="5">
      <SelectGroup>
        <SelectItem v-for="year in allYears" :key="year" :value="year">{{
          year
        }}</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
