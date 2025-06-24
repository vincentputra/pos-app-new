<script setup lang="ts">
import { onMounted, nextTick, watch } from "vue";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsers } from "@/composables/useUsers";

const { usersByRole, fetchUsersByRole } = useUsers();
const selectedUser = ref("0");

const emit = defineEmits<{
  (e: "user-change", user: number): void;
}>();

watch(selectedUser, (newValue) => {
  emit("user-change", Number(newValue));
});

onMounted(async () => {
  nextTick(async () => {
    await fetchUsersByRole(1);
  });
});
</script>

<template>
  <Select v-model="selectedUser">
    <SelectTrigger class="w-full md:w-[180px] mb-4">
      <SelectValue placeholder="Select a cashier" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem value="0">All of the cashier</SelectItem>
        <SelectItem
          v-for="user in usersByRole"
          :key="user.id"
          :value="user.id"
          >{{ user.name }}</SelectItem
        >
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
