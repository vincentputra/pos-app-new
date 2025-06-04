import { ref } from "vue";
import { useFetch, useRuntimeConfig } from "nuxt/app";
import { useStorage } from "@/composables/useStorage";

type Shift = {
  id: number;
  user_id: number;
  cash_balance: number;
  expected_cash_balance: number;
  final_cash_balance: number;
  cash_difference: number;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: number;
    created_at: string;
    updated_at: string;
  };
};

type ShiftDetail = {
  id: number;
  user_id: number;
  cash_balance: number;
  cash_payments: number;
  cash_refunds: number;
  cash_changes: number;
  paid_in: number;
  paid_out: number;
  expected_cash_balance: number;
  gross_sales: number;
  refunds: number;
  discounts: number;
  tax_sales: number;
  net_sales: number;
  final_cash_balance: number;
  total_tendered: number;
  bank_transfer_total: number;
  ewallet_total: number;
  qris_total: number;
  cash_total: number;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: number;
    created_at: string;
    updated_at: string;
  };
};

type ShiftHistory = {
  id: number;
  shift_id: number;
  description: string;
  type: number;
  amount: number;
  created_at: string;
};

type TypeCash = {
  id: number;
  name: string;
};

type Page = {
  page: number;
  per_page: number;
  user_id?: number;
  date_range?: any;
};

export const useShifts = () => {
  const shifts = ref<Shift[]>([]);
  const shiftUser = ref<ShiftDetail>();
  const shiftDetail = ref<ShiftDetail>();
  const shiftHistories = ref<ShiftHistory[]>([]);
  const isTheShiftOpen = ref(false);
  const pageShift = ref<{
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
  const typeCash = ref<TypeCash[]>([
    {
      id: 0,
      name: "Pay-in",
    },
    {
      id: 1,
      name: "Pay-out",
    },
  ]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const storage = useStorage();
  const config = useRuntimeConfig();

  const initShiftUser = async (payload?: any) => {
    isLoading.value = true;
    error.value = null;

    try {
      const storedToken = storage.getItem("auth_token");
      if (!storedToken) throw new Error("No auth token found");
      const storedUser = storage.getItem("user");
      if (!storedUser) throw new Error("No user found");

      let tokenData: { value: string; expiresAt: number };
      let userData: { id: number; email: string; name: string; role: number };
      try {
        tokenData = JSON.parse(storedToken);
        userData = JSON.parse(storedUser);
      } catch {
        throw new Error("Invalid token format");
      }

      const userId = payload?.id || userData.id;
      const { data, error } = await useFetch<{
        data: ShiftDetail;
      }>(`${config.public.apiBase}/shifts/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
        },
      });

      if (error.value) {
        throw new Error(
          error.value.data.message || "Failed to fetch open shift user"
        );
      }

      if (!data.value?.data) {
        throw new Error("No data received from API");
      }

      shiftUser.value = data.value.data;
      // If there's an active shift (no updated_at means it hasn't been closed)
      isTheShiftOpen.value = data.value?.data && !data.value.data.updated_at;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch open shift user";
      throw new Error(error.value);
      //console.error("Error fetching open shift user:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const openShift = async (payload: any) => {
    isLoading.value = true;
    error.value = null;

    try {
      const storedToken = storage.getItem("auth_token");
      if (!storedToken) throw new Error("No auth token found");
      const storedUser = storage.getItem("user");
      if (!storedUser) throw new Error("No user found");

      let tokenData: { value: string; expiresAt: number };
      let userData: { id: number; email: string; name: string; role: number };
      try {
        tokenData = JSON.parse(storedToken);
        userData = JSON.parse(storedUser);
      } catch {
        throw new Error("Invalid token format");
      }

      payload = { user_id: userData.id, ...payload };
      const { data, error } = await useFetch(
        `${config.public.apiBase}/shifts`,
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
        throw new Error(
          error.value.data.message || "Failed to open shift user"
        );
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      isTheShiftOpen.value = true;
      await initShiftUser();
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to open shift user";
      throw new Error(error.value);
      //console.error("Error updating user:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const closeShift = async (payload: any) => {
    isLoading.value = true;
    error.value = null;

    try {
      const storedToken = storage.getItem("auth_token");
      if (!storedToken) throw new Error("No auth token found");
      const storedUser = storage.getItem("user");
      if (!storedUser) throw new Error("No user found");

      let tokenData: { value: string; expiresAt: number };
      let userData: { id: number; email: string; name: string; role: number };
      try {
        tokenData = JSON.parse(storedToken);
        userData = JSON.parse(storedUser);
      } catch {
        throw new Error("Invalid token format");
      }

      payload = {
        user_id: userData.id,
        cash_balance: shiftUser.value?.cash_balance ?? 0,
        ...payload,
      };
      const { data, error } = await useFetch(
        `${config.public.apiBase}/shifts/${shiftUser.value?.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: payload,
        }
      );

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to update user");
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      isTheShiftOpen.value = false;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to update user";
      throw new Error(error.value);
      //console.error("Error updating user:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchShifts = async (payload: Page) => {
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
        payload.user_id !== undefined &&
        payload.user_id !== null &&
        Number(payload.user_id) !== 0
      ) {
        parameter = parameter + `&user_id=${payload.user_id}`;
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
        data: Shift[];
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      }>(`${config.public.apiBase}/shifts?${parameter}`, {
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
        },
      });

      if (error.value) {
        throw new Error(error.value.data.message || "Failed to fetch shifts");
      }

      if (!data.value?.data) {
        throw new Error("No data received from API");
      }

      shifts.value = data.value.data;
      pageShift.value = data.value.meta;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch shifts";
      throw new Error(error.value);
      // error.value == "Unauthenticated."
      //console.error("Error fetching shifts:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchShiftDetail = async (payload: any) => {
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

      const { data, error } = await useFetch<{
        data: ShiftDetail;
      }>(`${config.public.apiBase}/shifts/${payload.id}`, {
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          Accept: "application/json",
        },
      });

      if (error.value) {
        throw new Error(
          error.value.data.message || "Failed to fetch shift detail"
        );
      }

      if (!data.value?.data) {
        throw new Error("No data received from API");
      }

      shiftDetail.value = data.value.data;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch shift detail";
      throw new Error(error.value);
      //console.error("Error fetching shift detail:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchShiftHistories = async () => {
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

      const { data, error } = await useFetch<{
        data: ShiftHistory[];
      }>(
        `${config.public.apiBase}/shift-histories?shift_id=${shiftUser.value?.id}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.value}`,
            Accept: "application/json",
          },
        }
      );

      if (error.value) {
        throw new Error(
          error.value.data.message || "Failed to fetch cash reports"
        );
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      shiftHistories.value = data.value.data;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch cash reports";
      throw new Error(error.value);
      // error.value == "Unauthenticated."
      //console.error("Error fetching users:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const createShiftHistory = async (payload: any) => {
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
        `${config.public.apiBase}/shifts/${shiftUser.value?.id}/histories`,
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
        throw new Error(
          error.value.data.message || "Failed to create cash report"
        );
      }

      if (!data.value) {
        throw new Error("No data received from API");
      }

      return data.value;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to create cash report";
      throw new Error(error.value);
      //console.error("Error creating cash report:", e);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    shifts,
    shiftDetail,
    shiftUser,
    shiftHistories,
    pageShift,
    typeCash,
    isTheShiftOpen,
    isLoading,
    error,
    initShiftUser,
    openShift,
    closeShift,
    fetchShifts,
    fetchShiftDetail,
    fetchShiftHistories,
    createShiftHistory,
  };
};
