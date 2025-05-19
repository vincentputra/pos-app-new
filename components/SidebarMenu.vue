<template>
  <aside
    class="flex h-full flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in"
    :class="isMinimized ? 'w-16' : 'w-60'"
  >
    <div class="flex h-[60px] flex-shrink-0 items-center justify-between p-2">
      <h1
        class="overflow-hidden text-xl font-bold text-gray-800 transition-all delay-500 duration-300 ease-in"
        :class="isMinimized ? 'w-0 opacity-0' : 'opacity-100'"
      >
        Dhayoo POS
      </h1>
      <Button
        variant="ghost"
        size="null"
        @click="toggleMinimize"
        class="ml-auto p-3"
      >
        <ChevronLeft
          class="h-5 w-5 transition-transform duration-300"
          :class="isMinimized ? 'rotate-180' : ''"
        />
      </Button>
    </div>

    <nav class="flex-1 space-y-2 p-2">
      <NuxtLink
        v-for="page in pages"
        :key="page.id"
        :to="page.path"
        class="flex h-[48px] w-full items-center rounded-lg p-3 transition-colors hover:bg-gray-100"
        :class="{ 'bg-gray-100': page.active }"
      >
        <component
          :is="page.icon"
          class="h-5 w-5 text-gray-600"
          :class="isMinimized ? '' : 'mr-3'"
        />
        <span
          class="overflow-hidden text-gray-700 transition-opacity delay-300 duration-500 ease-in"
          :class="isMinimized ? 'w-0 opacity-0' : 'opacity-100'"
        >
          {{ page.name }}
        </span>
      </NuxtLink>
    </nav>

    <div class="flex-shrink-0 border-t border-gray-200 p-2">
      <Button
        variant="ghost"
        @click="handleLogout"
        class="flex w-full items-center rounded-lg p-3 transition-colors hover:bg-gray-100"
        data-logout
        :disabled="isLoading"
      >
        <component
          :is="isLoading ? Loader2 : LogOut"
          class="h-5 w-5 text-gray-600"
          :class="[isMinimized ? '' : 'mr-3', isLoading ? 'animate-spin' : '']"
        />
        <span
          class="overflow-hidden text-gray-700 transition-opacity delay-300 duration-500 ease-in"
          :class="isMinimized ? 'w-0 opacity-0' : 'opacity-100'"
        >
          {{ isLoading ? "Logging out..." : "Logout" }}
        </span>
      </Button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  House,
  Package,
  Truck,
  Users,
  NotebookTabs,
  Boxes,
  ShoppingCart,
  FileText,
  ChevronLeft,
  LogOut,
  Loader2,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useRoute } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "@/components/ui/toast/use-toast";
import { watch, onMounted, ref } from "vue";

const isMinimized = ref(false);

type Page = {
  id: number;
  name: string;
  icon: any;
  path: string;
  active: boolean;
};

const pages = ref<Page[]>([
  { id: 1, name: "Dashboard", icon: House, path: "/", active: false },
  {
    id: 2,
    name: "Data User",
    icon: Users,
    path: "/manage-user",
    active: false,
  },
  {
    id: 3,
    name: "Data Suplier",
    icon: Truck,
    path: "/manage-supplier",
    active: false,
  },
  {
    id: 4,
    name: "Data Kategori Produk",
    icon: NotebookTabs,
    path: "/manage-product-category",
    active: false,
  },
  {
    id: 5,
    name: "Data Produk",
    icon: Boxes,
    path: "/manage-product",
    active: false,
  },
  {
    id: 6,
    name: "Transaksi",
    icon: ShoppingCart,
    path: "/transaction",
    active: false,
  },
  {
    id: 7,
    name: "Laporan Bahan Baku",
    icon: Package,
    path: "/report-inventory",
    active: false,
  },
  {
    id: 8,
    name: "Laporan Transaksi",
    icon: FileText,
    path: "/report-transaction",
    active: false,
  },
]);
const route = useRoute();

watch(
  () => route.path,
  (newPath) => {
    pages.value = pages.value.map((page) => ({
      ...page,
      active: page.path === newPath,
    }));
  },
  { immediate: true },
);

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
  localStorage.setItem("isMinimized", isMinimized.value.toString());
};

onMounted(() => {
  const isMinimizedFromStorage = localStorage.getItem("isMinimized");
  if (isMinimizedFromStorage) {
    isMinimized.value = isMinimizedFromStorage === "true";
  }
});

const { logout } = useAuth();
const { toast } = useToast();

const isLoading = ref(false);

const handleLogout = async () => {
  try {
    isLoading.value = true;
    await logout();
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to logout. Please try again.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>
