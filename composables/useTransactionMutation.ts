import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";
import { toast } from "vue-sonner";

type TransactionItem = {
  product_id: number;
  quantity: number;
  price: number;
};

type TransactionPayload = {
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
};

export const useTransactionMutation = () => {
  const storage = useStorage();
  const config = useRuntimeConfig();

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

  return {
    createTransaction,
  };
};
