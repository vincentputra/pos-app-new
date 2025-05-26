import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";
import { toast } from "vue-sonner";

type TransactionItemPayload = {
  product_id: number;
  quantity: number;
  price: number;
};

type TransactionPayload = {
  items: TransactionItemPayload[];
  subtotal: number;
  tax: number;
  total: number;
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
  payment_status: string;
  total_price: number;
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
      id: "paid",
      name: "Paid",
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
        throw new Error("No response data received");
      }

      toast({
        title: "Success",
        description: "Transaction completed successfully",
        variant: "success",
      });

      return data.value;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create transaction";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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

  return {
    transactions,
    transactionDetail,
    pageTransaction,
    paymentMethods,
    isLoading,
    error,
    statusTransaction,
    createTransaction,
    fetchTransactions,
  };
};
