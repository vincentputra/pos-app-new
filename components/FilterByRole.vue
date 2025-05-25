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
const selectedRole = ref(2);

const emit = defineEmits<{
  (e: "role-change", user: number): void;
}>();

watch(selectedRole, (newValue) => {
  emit("role-change", newValue);
});
</script>

<template>
  <Select v-model="selectedRole">
    <SelectTrigger class="w-[180px]">
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
