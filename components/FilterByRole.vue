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
import { useUsers } from "@/composables/useUsers";

const { roles } = useUsers();
const selectedRole = ref("2");

const emit = defineEmits<{
  (e: "role-change", role: number): void;
}>();

watch(selectedRole, (newValue) => {
  emit("role-change", Number(newValue));
});
</script>

<template>
  <Select v-model="selectedRole">
    <SelectTrigger class="w-full md:w-[180px] mb-4">
      <SelectValue placeholder="Select a role" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem value="2">All of the roles</SelectItem>
        <SelectItem v-for="role in roles" :key="role.id" :value="role.id">{{
          role.name
        }}</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
