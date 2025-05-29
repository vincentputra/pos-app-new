<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  LogOut,
  Loader2,
  BadgeDollarSign,
  ChevronRight,
} from "lucide-vue-next";

import { useRoute } from "vue-router";
import { watch, onMounted, nextTick, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { toast } from "vue-sonner";

const route = useRoute();
const { user, initAuth, logout } = useAuth();
const isLoading = ref(false);
const errorMessage = ref("");
const hasError = ref(false);

type Page = {
  name: string;
  path: string;
  isActive: boolean;
  items: { name: string; path: string; isActive: boolean }[];
};

const adminRoutes = [
  {
    name: "Reports",
    path: "/",
    isActive: false,
    items: [
      {
        name: "Sales",
        path: "/sales-report",
        isActive: false,
      },
      {
        name: "Transactions",
        path: "/transactions-report",
        isActive: false,
      },
      {
        name: "Shifts",
        path: "/shifts-report",
        isActive: false,
      },
    ],
  },
  {
    name: "Inventory",
    path: "/",
    isActive: false,
    items: [
      {
        name: "Discount",
        path: "/discounts",
        isActive: false,
      },
      {
        name: "Product",
        path: "/product-inventory",
        isActive: false,
      },
      {
        name: "Summary",
        path: "/inventory-summary",
        isActive: false,
      },
      {
        name: "Adjustment",
        path: "/inventory-adjustment",
        isActive: false,
      },
    ],
  },
  {
    name: "Employees",
    path: "/employees",
    isActive: false,
    items: [],
  },
];

const cashierRoutes = [
  {
    name: "Point Of Sale",
    path: "/",
    isActive: false,
    items: [
      {
        name: "Order",
        path: "/pos",
        isActive: false,
      },
      {
        name: "Receipts",
        path: "/transactions-report",
        isActive: false,
      },
      {
        name: "Shift",
        path: "/shift",
        isActive: false,
      },
    ],
  },
  {
    name: "Product Adjustment",
    path: "/create-adjustment",
    isActive: false,
    items: [],
  },
];

const pages = ref<Page[]>([
  {
    name: "Dashboard",
    path: "/",
    isActive: true,
    items: [],
  },
]);

const handleLogout = async () => {
  try {
    errorMessage.value = "";
    hasError.value = false;
    isLoading.value = true;
    await logout();
  } catch (error) {
    hasError.value = true;
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Failed to logout. Please try again.";
    toast.error(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
};

const updateActivePage = (newPath: any) => {
  pages.value = pages.value.map((page) => ({
    ...page,
    isActive:
      page.path === newPath || page.items.some((item) => item.path === newPath),
    items: page.items.map((item) => ({
      ...item,
      isActive:
        item.path === newPath ||
        ("/create-adjustment" === newPath &&
          item.path === "/inventory-adjustment") ||
        ("/cash-management" === newPath && item.path === "/shift"),
    })),
  }));
};

watch(
  () => route.path,
  (newPath) => {
    updateActivePage(newPath);
  },
  { immediate: true }
);

onMounted(async () => {
  await initAuth();
  if (user.value?.role == 0) {
    pages.value = [...pages.value, ...adminRoutes];
  } else {
    pages.value = [...pages.value, ...cashierRoutes];
  }
  updateActivePage(route.path);
});
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <BadgeDollarSign class="size-4" />
              <span class="font-semibold">Dhayoo POS</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent class="gap-0">
        <SidebarGroup>
          <SidebarMenu>
            <Collapsible
              v-for="item in pages"
              :key="item.name"
              :title="item.name"
              default-open
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuSubButton v-if="item.items.length">
                    {{ item.name }}
                    <ChevronRight
                      class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuSubButton>
                  <SidebarMenuSubButton
                    v-else
                    :is-active="item.isActive"
                    :class="[item.isActive ? 'font-semibold' : '']"
                  >
                    <NuxtLink :to="item.path" class="w-full">
                      {{ item.name }}
                    </NuxtLink>
                  </SidebarMenuSubButton>
                </CollapsibleTrigger>

                <CollapsibleContent v-if="item.items.length">
                  <SidebarMenuSub>
                    <SidebarMenuSubItem
                      v-for="childItem in item.items"
                      :key="childItem.name"
                    >
                      <SidebarMenuSubButton
                        as-child
                        :class="[childItem.isActive ? 'font-semibold' : '']"
                        :is-active="childItem.isActive"
                      >
                        <NuxtLink :to="childItem.path" class="w-full">
                          {{ childItem.name }}
                        </NuxtLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              @click="handleLogout"
              :disabled="isLoading"
              class="transition-colors hover:bg-gray-100"
            >
              <component
                :is="isLoading ? Loader2 : LogOut"
                class="h-5 w-5 text-gray-600"
                :class="[isLoading ? 'animate-spin' : '']"
              />
              <span class="font-semibold">
                {{ isLoading ? "Logging out..." : "Logout" }}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <SidebarInset class="flex-row">
      <header
        class="flex h-full shrink-0 items-start border-r p-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
      >
        <SidebarTrigger class="-ml-1" />
      </header>
      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>
