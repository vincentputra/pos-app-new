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
import { toast } from "vue-sonner";
import { RefreshCcw, Plus } from "lucide-vue-next";
import { useUsers } from "@/composables/useUsers";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const { users, isLoading, error, fetchUsers } = useUsers();

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
  role: "",
});

const openAddModal = () => {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  isModalOpen.value = true;
};

const editCategory = (user: User) => {
  isEditing.value = true;
  editingId.value = user.id;
  form.name = user.name;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const resetForm = () => {
  form.name = "";
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
        email: "",
        role: "",
      };
    }
    toast.success("User updated successfully");
  } else {
    // Add new user
    users.value.push({
      id: Date.now(),
      name: form.name,
      email: "",
      role: "",
    });
    toast.success("User added successfully");
  }
  closeModal();
};

const deleteCategory = (id: number) => {
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
                <TableCell>{{ user.role }}</TableCell>
                <TableCell>
                  <div class="flex gap-2" v-if="user.id !== 0">
                    <Button
                      variant="outline"
                      size="sm"
                      @click="editCategory(user)"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      @click="deleteCategory(user.id)"
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
    </div>

    <!-- Add/Edit Modal -->
    <Dialog :open="isModalOpen" @update:open="closeModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{
            isEditing ? "Edit Category" : "Add Category"
          }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Category Name</Label>
            <Input id="name" v-model="form.name" required />
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
