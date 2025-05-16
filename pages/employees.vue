<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "vue-sonner";
import { RefreshCcw, Plus } from "lucide-vue-next";
import { useUsers } from "@/composables/useUsers";

interface User {
  id: number;
  name: string;
  email: string;
  role: number;
}

const { users, roles, isLoading, fetchUsers } = useUsers();

onMounted(() => {
  nextTick(async () => {
    await fetchUsers();
  });
});

const isModalOpen = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const form = reactive({
  name: "",
  email: "",
  role: 0,
});

const openAddModal = () => {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  isModalOpen.value = true;
};

const editUser = (user: User) => {
  isEditing.value = true;
  editingId.value = user.id;
  form.name = user.name;
  form.email = user.email;
  form.role = user.role;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const resetForm = () => {
  form.name = "";
  form.email = "";
  form.role = 0;
};

const handleSubmit = () => {
  // Here you would typically make an API call to save the category
  if (isEditing.value) {
    // Update existing category
    const index = users.value.findIndex(
      (s) => Number(s.id) === editingId.value
    );
    if (index !== -1) {
      users.value[index] = {
        id: editingId.value!,
        name: form.name,
        email: form.email,
        role: form.role,
      };
    }
    toast.success("User updated successfully");
  } else {
    // Add new user
    users.value.push({
      id: Date.now(),
      name: form.name,
      email: form.email,
      role: form.role,
    });
    toast.success("User added successfully");
  }
  closeModal();
};

const deleteUser = (id: number) => {
  // Here you would typically make an API call to delete the user
  users.value = users.value.filter((s) => s.id !== id);
  toast.success("User deleted successfully");
};

definePageMeta({
  layout: "authenticated",
  middleware: ["auth"],
});
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <header class="flex-none border-b border-gray-200 bg-white p-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-800">Employees</h1>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="fetchUsers">
            <RefreshCcw class="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" @click="openAddModal">
            <Plus class="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>
    </header>

    <div class="custom-scrollbar min-h-0 flex-1 p-4">
      <div class="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="isLoading">
              <TableRow v-for="n in 5" :key="n">
                <TableCell v-for="m in 2" :key="m">
                  <div class="h-4 w-24 animate-pulse rounded bg-gray-100" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else-if="users.length">
              <TableRow v-for="user in users" :key="user.id">
                <TableCell>{{ user.name }}</TableCell>
                <TableCell>{{ user.email }}</TableCell>
                <TableCell>{{
                  roles.find((r) => r.id === user.role)?.name
                }}</TableCell>
                <TableCell>
                  <div class="flex gap-2" v-if="user.id !== 0">
                    <Button variant="outline" size="sm" @click="editUser(user)">
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      @click="deleteUser(user.id)"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </div>

      <Pagination
        v-slot="{ page }"
        :items-per-page="10"
        :total="100"
        :sibling-count="1"
        show-edges
        :default-page="2"
        class="mt-5"
      >
        <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
          <PaginationFirst />
          <PaginationPrevious />
          <template v-for="(item, index) in items">
            <PaginationItem
              v-if="item.type === 'page'"
              :key="index"
              :value="item.value"
              as-child
            >
              <Button
                class="w-10 h-10 p-0"
                :variant="item.value === page ? 'default' : 'outline'"
              >
                {{ item.value }}
              </Button>
            </PaginationItem>
            <PaginationEllipsis v-else :key="item.type" :index="index" />
          </template>
          <PaginationNext />
          <PaginationLast />
        </PaginationContent>
      </Pagination>
    </div>

    <!-- Add/Edit Modal -->
    <Dialog :open="isModalOpen" @update:open="closeModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{
            isEditing ? "Edit Employee" : "Add Employee"
          }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" v-model="form.name" required />
          </div>
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" v-model="form.email" required />
          </div>
          <div class="space-y-2">
            <Label for="name">Role</Label>
            <Select v-model="form.role">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Role</SelectLabel>
                  <SelectItem
                    v-for="role in roles"
                    :key="role.id"
                    :value="role.id"
                    >{{ role.name }}</SelectItem
                  >
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="closeModal"
              >Cancel</Button
            >
            <Button type="submit">{{ isEditing ? "Update" : "Add" }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
