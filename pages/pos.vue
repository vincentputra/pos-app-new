<script setup lang="ts">
import { onMounted, nextTick } from "vue";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "vue-sonner";
import { useShifts } from "@/composables/useShifts";

const { isTheShiftOpen, error, initShiftUser, openShift } = useShifts();

onMounted(async () => {
  nextTick(async () => {
    await initShiftUser();
  });
});

const handleOpenShift = async (payload: any) => {
  await openShift(payload);

  if (error.value) {
    toast.error(error.value ?? "Something went wrong");
    return;
  }

  toast.success("Open shift successfully");
};

definePageMeta({
  layout: "authenticated",
  middleware: ["auth"],
});
</script>

<template>
  <Sheet>
    <div class="md:flex h-full w-full">
      <!-- Main Content -->
      <ShiftCashier v-if="!isTheShiftOpen" @open-shift="handleOpenShift" />
      <ProductGrid v-else />

      <!-- Cart Sidebar -->
      <SheetContent class="w-full md:w-[540px]">
        <CartSidebar />
      </SheetContent>
      <CartSidebar class="invisible md:visible" />
    </div>
  </Sheet>
</template>
