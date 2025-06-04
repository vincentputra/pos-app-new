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
import { RefreshCcw, Plus, User } from "lucide-vue-next";
import { useUsers } from "@/composables/useUsers";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: number;
}

const {
  users,
  pageUser,
  roles,
  isLoading,
  error,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} = useUsers();

const currentPage = ref(1);
const itemsPerPage = ref(15);
const selectedRole = ref(2);
const search = ref("");
const isModalOpen = ref(false);
const isEditing = ref(false);
const isDeleted = ref(false);
const editingId = ref<number | null>(null);

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchUsers({
    page: currentPage.value,
    per_page: itemsPerPage.value,
    role: selectedRole.value,
    search: search.value,
  });
};

onMounted(() => {
  nextTick(async () => {
    await handlePageChange(1);
  });
});

const filterByRole = async (payload: any) => {
  selectedRole.value = Number(payload);
  await handlePageChange(1);
};

const filterBySearch = async (payload: any) => {
  search.value = payload;
  await handlePageChange(1);
};

const form = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  role: 0,
});

const openAddModal = () => {
  isEditing.value = false;
  isDeleted.value = false;
  editingId.value = null;
  resetForm();
  isModalOpen.value = true;
};

const openDeleteModal = (id: number) => {
  isEditing.value = false;
  isDeleted.value = true;
  editingId.value = id;
  isModalOpen.value = true;
};

const openEditModal = (user: User) => {
  isEditing.value = true;
  isDeleted.value = false;
  editingId.value = user.id;
  form.name = user.name;
  form.email = user.email;
  form.phone = user.phone;
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
  form.phone = "";
  form.password = "";
  form.role = 0;
};

const handleSubmit = async () => {
  if (isEditing.value) {
    // Here you would typically make an API call to update the user
    await updateUser({
      id: editingId.value,
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      password: form.password,
    });

    if (error.value) {
      toast.error(error.value ?? "Something went wrong");
      return;
    }

    // Update existing user
    const index = users.value.findIndex(
      (s) => Number(s.id) === editingId.value
    );

    if (index !== -1) {
      users.value[index] = {
        id: editingId.value!,
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        password: form.password,
      };
    }

    toast.success("User updated successfully");
  } else {
    // Here you would typically make an API call to add the user
    const response = await createUser({
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      password: form.password,
    });

    if (error.value) {
      toast.error(error.value ?? "Something went wrong");
      return;
    }

    // Add new user
    users.value.push({
      id: (response as any).id ?? Date.now(),
      name: (response as any).name ?? form.name,
      email: (response as any).email ?? form.email,
      phone: (response as any).phone ?? form.phone,
      role: (response as any).role,
      password: form.password,
    });

    toast.success("User added successfully");
  }
  closeModal();
};

const handleDelete = async () => {
  await deleteUser({ id: editingId.value });

  if (error.value) {
    toast.error(error.value ?? "Something went wrong");
    return;
  }

  // Here you would typically make an API call to delete the user
  users.value = users.value.filter((s) => s.id !== editingId.value);
  toast.success("User deleted successfully");
  closeModal();
};

definePageMeta({
  layout: "authenticated",
  middleware: ["auth"],
});
</script>

<template>
  <div class="flex h-full w-full flex-1 flex-col overflow-hidden">
    <header class="flex-none border-b border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-800">Employees</h1>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="
              fetchUsers({
                page: currentPage,
                per_page: itemsPerPage,
              })
            "
          >
            <RefreshCcw class="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" size="sm" @click="openAddModal">
            <Plus class="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex-1 p-4">
      <div class="mb-4 flex items-center gap-4">
        <FilterByRole @role-change="filterByRole" />
        <FilterBySearch @search-filter="filterBySearch" />
      </div>
      <div class="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="isLoading">
              <TableRow v-for="n in pageUser.total ?? 5" :key="n">
                <TableCell v-for="m in 5" :key="m">
                  <div class="h-4 w-24 animate-pulse rounded bg-gray-100" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else-if="users.length">
              <TableRow v-for="user in users" :key="user.id">
                <TableCell>{{ user.name }}</TableCell>
                <TableCell>{{ user.email }}</TableCell>
                <TableCell>{{ user.phone }}</TableCell>
                <TableCell>{{
                  roles.find((r) => r.id === user.role)?.name
                }}</TableCell>
                <TableCell>
                  <div class="flex gap-2" v-if="user.id !== 0">
                    <Button
                      type="button"
                      size="sm"
                      @click="openEditModal(user)"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      @click="openDeleteModal(user.id)"
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
        :items-per-page="itemsPerPage"
        :total="pageUser.total"
        :default-page="currentPage"
        :sibling-count="1"
        :class="'mt-4'"
        show-edges
        @update:page="handlePageChange"
      >
        <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
          <PaginationFirst />
          <PaginationPrevious />
          <template v-for="(item, index) in items">
            <PaginationItem
              v-if="item.type === 'page'"
              :key="index"
              :value="item.value"
              :is-active="item.value === page"
            >
              {{ item.value }}
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
      <DialogContent v-if="!isDeleted">
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
            <Label for="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              pattern="[0-9]+"
              v-model="form.phone"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="password" v-if="!isEditing">Password</Label>
            <Label for="password" v-else
              >Password (Leave it empty if you don't need to update the
              password)</Label
            >
            <Input
              id="password"
              type="password"
              v-model="form.password"
              v-bind:required="!isEditing"
            />
          </div>
          <div class="space-y-2">
            <Label>Role</Label>
            <Select v-model="form.role">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
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
          <div v-if="error" class="mt-2 text-sm text-red-600">
            {{ error }}
          </div>
          <DialogFooter class="sm:justify-between">
            <Button type="button" variant="ghost" @click="closeModal"
              >Cancel</Button
            >
            <Button type="submit">{{ isEditing ? "Update" : "Add" }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <DialogContent v-else>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to permanently
            delete this file from our servers?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="sm:justify-between">
          <Button type="button" variant="ghost" @click="closeModal"
            >Cancel</Button
          >
          <Button type="submit" @click="handleDelete">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
