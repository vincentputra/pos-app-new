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
import { watch, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { toast } from "vue-sonner";

const route = useRoute();
const { logout } = useAuth();
const isLoading = ref(false);
const errorMessage = ref("");
const hasError = ref(false);

type Page = {
  name: string;
  path: string;
  isActive: boolean;
  items: { name: string; path: string; isActive: boolean }[];
};

const pages = ref<Page[]>([
  {
    name: "Dashboard",
    path: "/",
    isActive: true,
    items: [],
  },
  {
    name: "Point of Sale",
    path: "/pos",
    isActive: true,
    items: [],
  },
  {
    name: "Reports",
    path: "/",
    isActive: false,
    items: [
      {
        name: "Sales",
        path: "/sales",
        isActive: false,
      },
      {
        name: "Transactions",
        path: "/report-transactions",
        isActive: false,
      },
      {
        name: "Invoices",
        path: "/invoices",
        isActive: false,
      },
      {
        name: "Shifts",
        path: "/shifts",
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
        name: "Product",
        path: "/product",
        isActive: false,
      },
      {
        name: "Summary",
        path: "/summary",
        isActive: false,
      },
      {
        name: "Adjustment",
        path: "/adjustment",
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

watch(
  () => route.path,
  (newPath) => {
    pages.value = pages.value.map((page) => ({
      ...page,
      isActive: page.path === newPath,
    }));
  },
  { immediate: true }
);
</script>

<template>
  <SidebarProvider>
    <Sidebar>
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
                  <SidebarMenuButton v-if="item.items.length">
                    {{ item.name }}
                    <ChevronRight
                      class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                  <SidebarMenuButton v-else :is-active="item.isActive">
                    <NuxtLink :to="item.path" class="w-full">
                      {{ item.name }}
                    </NuxtLink>
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent v-if="item.items.length">
                  <SidebarMenuSub>
                    <SidebarMenuSubItem
                      v-for="childItem in item.items"
                      :key="childItem.name"
                    >
                      <SidebarMenuSubButton
                        as-child
                        :is-active="childItem.isActive"
                      >
                        <a :href="childItem.path">{{ childItem.name }}</a>
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
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
      >
        <SidebarTrigger class="-ml-1" />
      </header>
      <div class="flex min-h-0 flex-1">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
