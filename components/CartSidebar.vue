<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Minus, Plus, Printer, Loader2 } from "lucide-vue-next";
import { useCartStore } from "@/stores/useCartStore";
import { usePrice } from "@/composables/usePrice";
import { useTransactionMutation } from "@/composables/useTransactionMutation";
import { useStorage } from "@/composables/useStorage";
import { toast } from "vue-sonner";

const storage = useStorage();
const cartStore = useCartStore();
const { formatPrice } = usePrice();
const { createTransaction } = useTransactionMutation();

const showPaymentDialog = ref(false);
const discountAmount = ref(0);
const selectedPaymentMethod = ref("");
const note = ref("");
const amountPaid = ref<number | null>(null);
const change = ref(0);

const paymentMethods = [
  { id: "bank_transfer", name: "Bank Transfer" },
  { id: "e_wallet", name: "E-Wallets" },
  { id: "qris", name: "QRIS" },
  { id: "cash", name: "Cash" },
];

const cartItems = computed(() => cartStore.items);
const subtotal = computed(() => cartStore.subtotal);
const tax = computed(() => (subtotal.value - discountAmount.value) * 0.1);
const total = computed(() => subtotal.value - discountAmount.value + tax.value);
const isProcessing = ref(false);

const incrementQuantity = (item: any) => {
  cartStore.updateQuantity(item.id, item.quantity + 1);
};

const decrementQuantity = (item: any) => {
  cartStore.updateQuantity(item.id, item.quantity - 1);
};

const calculateChange = () => {
  if (!amountPaid.value) {
    change.value = 0;
    return;
  }
  change.value = amountPaid.value - total.value;
};

const handlePrintBill = async () => {
  if (cartItems.value.length === 0) return;
  if (!amountPaid.value || amountPaid.value < total.value) {
    toast.error("Please input the correct amount paid.");
    return;
  }
  if (!selectedPaymentMethod.value) {
    toast.error("Please select a payment method.");
    return;
  }

  isProcessing.value = true;
  try {
    const storedUser = storage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).id : null;

    const payload = {
      user_id: userId,
      items: cartItems.value.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: subtotal.value,
      discount: discountAmount.value,
      tax: tax.value,
      total: total.value,
      payment_status: "paid",
      payment_method: selectedPaymentMethod.value,
      note: note.value,
      amount_paid: amountPaid.value || total.value,
      change: change.value,
      date: new Intl.DateTimeFormat("en-CA").format(new Date()),
    };

    await createTransaction(payload);
    cartStore.reset();
    toast.success("Bill has been printed and transaction recorded");
  } catch (error) {
    console.error("Transaction failed:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to process transaction"
    );
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <aside
    class="flex h-full w-2/4 flex-col overflow-hidden border-l border-gray-200 lg:w-2/5 xl:w-1/4"
  >
    <div class="flex-shrink-0 border-b border-gray-200 p-4">
      <h2 class="text-lg font-semibold text-gray-800">Shopping Cart</h2>
    </div>

    <div class="flex-1 overflow-auto">
      <div v-if="cartItems.length === 0" class="mt-8 text-center text-gray-500">
        Cart is empty
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="item in cartItems"
          :key="item.id"
          class="sm:flex justify-between gap-2 border-b-1 p-4"
        >
          <div class="flex flex-col mb-4">
            <h3 class="font-medium text-gray-800">{{ item.name }}</h3>
            <p class="text-sm text-gray-600">
              {{ formatPrice(item.price) }}
            </p>
          </div>
          <div class="flex items-center">
            <Button
              variant="outline"
              size="icon"
              @click="decrementQuantity(item)"
            >
              <Minus class="h-4 w-4" />
            </Button>
            <span class="w-8 text-center">{{ item.quantity }}</span>
            <Button
              variant="outline"
              size="icon"
              @click="incrementQuantity(item)"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 space-y-4 border-t border-gray-200 p-4">
      <div class="space-y-2">
        <div class="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{{ formatPrice(subtotal) }}</span>
        </div>
        <div class="flex items-center justify-between text-gray-600">
          <span>Discount</span>
          <div class="flex items-center space-x-2">
            <input
              type="number"
              v-model="discountAmount"
              class="w-20 rounded-lg border border-gray-200 p-2 text-right"
              min="0"
              :max="subtotal"
              placeholder="0.00"
            />
          </div>
        </div>
        <div class="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>{{ formatPrice(tax) }}</span>
        </div>
        <div class="flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>{{ formatPrice(total) }}</span>
        </div>
      </div>

      <Button
        class="w-full"
        size="lg"
        :disabled="cartItems.length === 0 || isProcessing"
        @click="showPaymentDialog = true"
      >
        <Printer class="mr-2 h-4 w-4" />
        Print Bill
      </Button>

      <Dialog
        :open="showPaymentDialog"
        @update:open="showPaymentDialog = false"
      >
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete the payment information below to proceed.
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <div
              class="flex items-center justify-between space-y-2 text-gray-600"
            >
              <span>Amount Paid</span>
              <div class="flex items-center space-x-2">
                <input
                  type="number"
                  v-model="amountPaid"
                  class="w-full rounded-lg border border-gray-200 p-2 text-right"
                  min="0"
                  :placeholder="formatPrice(total)"
                  @input="calculateChange"
                />
              </div>
            </div>

            <div class="flex justify-between space-y-2">
              <span class="text-gray-600">Change</span>
              <span
                class="font-medium"
                :class="change >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ formatPrice(change) }}
              </span>
            </div>

            <div class="space-y-2">
              <label class="text-gray-600">Payment Method</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="method in paymentMethods"
                  :key="method.id"
                  @click="selectedPaymentMethod = method.id"
                  :class="[
                    'flex items-center justify-center rounded-lg border p-2 text-sm transition-colors',
                    selectedPaymentMethod === method.id
                      ? 'border-primary bg-primary text-white hover:bg-primary/90'
                      : 'border-gray-200 hover:bg-gray-50',
                  ]"
                >
                  {{ method.name }}
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-gray-600">Note</label>
              <textarea
                v-model="note"
                rows="2"
                class="w-full rounded-lg border border-gray-200 p-2 text-sm"
                placeholder="Add any special notes here..."
              ></textarea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showPaymentDialog = false">
              Cancel
            </Button>
            <Button :disabled="isProcessing" @click="handlePrintBill">
              <Loader2 v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
              {{ isProcessing ? "Processing..." : "Confirm Payment" }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </aside>
</template>
