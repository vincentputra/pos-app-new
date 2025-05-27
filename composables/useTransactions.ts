import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";
import { toast } from "vue-sonner";

type TransactionItemPayload = {
  product_id: number;
  quantity: number;
  price: number;
};

type TransactionPayload = {
  shift_id: number;
  user_id: number;
  discount_id: number | null;
  payment_method: string;
  total_price: number;
  total_payment: number;
  total_tax: number;
  type_discount: number;
  amount_discount: number;
  payment_status: string;
  subtotal: number;
  change: number;
  details: TransactionItemPayload[];
};

type TransactionDetail = {
  id: number;
  product: {
    id: number;
    name: string;
  };
  quantity: number;
  price: number;
  subtotal: number;
};

type Transaction = {
  id: number;
  user: {
    id: number;
    name: string;
  };
  shift_id: number;
  discount_id: number;
  payment_method: string;
  total_subtotal: number;
  total_price: number;
  total_payment: number;
  total_tax: number;
  type_discount: number;
  amount_discount: number;
  payment_status: string;
  date: string;
  details: TransactionDetail[];
};

type Status = {
  id: string;
  name: string;
};

type Page = {
  page: number;
  per_page: number;
  status?: string;
  user_id?: number;
  search?: string;
  date_range?: any;
};

export const useTransactions = () => {
  const transactions = ref<Transaction[]>([]);
  const transactionDetail = ref<TransactionDetail>();
  const pageTransaction = ref<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const storage = useStorage();
  const config = useRuntimeConfig();
  const statusTransaction = ref<Status[]>([
    {
      id: "pending",
      name: "Pending",
    },
    {
      id: "paid",
      name: "Paid",
    },
    {
      id: "failed",
      name: "Failed",
    },
    {
      id: "refunded",
      name: "Refunded",
    },
  ]);
  const paymentMethods = [
    { id: "bank_transfer", name: "Bank Transfer" },
    { id: "e_wallet", name: "E-Wallets" },
    { id: "qris", name: "QRIS" },
    { id: "cash", name: "Cash" },
  ];
  const taxAmount = 10 / 100;

  const formatNoReceipt = (payload: any) => {
    const date = new Date(payload.date ?? "");
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return "CS/" + payload.user + "/" + year + month + day + "/00" + payload.id;
  };

  const calculateDiscount = (
    subtotal: number,
    type_discount: number,
    amount_discount: number
  ) => {
    if (type_discount === 1) {
      return amount_discount;
    } else if (type_discount === 2) {
      return (subtotal * amount_discount) / 100;
    } else {
      return 0;
    }
  };

  const calculateTotal = (
    subtotal: number,
    tax: number,
    type_discount: number,
    amount_discount: number
  ) => {
    const discount = calculateDiscount(
      subtotal,
      type_discount,
      amount_discount
    );
    return subtotal - discount + tax;
  };

  const calculateChange = (total: number, total_payment: number) => {
    return total_payment - total;
  };

  const createTransaction = async (payload: TransactionPayload) => {
    try {
      const storedToken = storage.getItem("auth_token");
      if (!storedToken) throw new Error("No auth token found");

      let tokenData: { value: string; expiresAt: number };
      try {
        tokenData = JSON.parse(storedToken);
      } catch {
        throw new Error("Invalid token format");
      }

      const { data, error } = await useFetch(
        `${config.public.apiBase}/transactions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: payload,
        }
      );

      if (error.value) {
        throw new Error(error.value?.message || "Failed to create transaction");
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      toast.success("Transaction completed successfully");

      return data.value;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create transaction";
      toast.error(errorMessage);
      throw error;
    }
  };

  const fetchTransactions = async (payload: Page) => {
    isLoading.value = true;
    error.value = null;

    try {
      const storedToken = storage.getItem("auth_token");
      if (!storedToken) throw new Error("No auth token found");

      let tokenData: { value: string; expiresAt: number };
      try {
        tokenData = JSON.parse(storedToken);
      } catch {
        throw new Error("Invalid token format");
      }

      let parameter = `page=${payload.page}&per_page=${payload.per_page}`;
      if (
        payload.status !== undefined &&
        payload.status !== null &&
        payload.status !== "" &&
        payload.status !== "all"
      ) {
        parameter = parameter + `&status=${payload.status}`;
      }
      if (
        payload.user_id !== undefined &&
        payload.user_id !== null &&
        Number(payload.user_id) !== 0
      ) {
        parameter = parameter + `&user_id=${payload.user_id}`;
      }
      if (
        payload.search !== undefined &&
        payload.search !== null &&
        payload.search !== ""
      ) {
        parameter = parameter + `&search=${payload.search}`;
      }
      if (
        payload.date_range !== undefined &&
        payload.date_range !== null &&
        payload.date_range !== ""
      ) {
        parameter =
          parameter +
          `&date_from=${payload.date_range.start.toString()}&date_to=${payload.date_range.end.toString()}`;
      }
      const { data, error } = await useFetch<{
        data: Transaction[];
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      }>(`${config.public.apiBase}/transactions?${parameter}`, {
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
        },
      });

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to fetch users");
      }

      if (!data.value?.data) {
        throw new Error("No data received from API");
      }

      transactions.value = data.value.data;
      pageTransaction.value = data.value.meta;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch products";
      throw new Error(error.value);
      //console.error("Error fetching products:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteTransaction = async (payload: any) => {
    isLoading.value = true;
    error.value = null;

    try {
      const storedToken = storage.getItem("auth_token");
      if (!storedToken) throw new Error("No auth token found");

      let tokenData: { value: string; expiresAt: number };
      try {
        tokenData = JSON.parse(storedToken);
      } catch {
        throw new Error("Invalid token format");
      }

      const { data, error } = await useFetch(
        `${config.public.apiBase}/transactions/${payload.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (error.value) {
        throw new Error(
          error.value.data.message || "Failed to delete transaction"
        );
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      return data.value;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete transaction";
      throw new Error(error.value);
      //console.error("Error deleting user:", e);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    transactions,
    transactionDetail,
    pageTransaction,
    paymentMethods,
    taxAmount,
    isLoading,
    error,
    statusTransaction,
    fetchTransactions,
    createTransaction,
    deleteTransaction,
    formatNoReceipt,
    calculateDiscount,
    calculateChange,
    calculateTotal,
  };
};
