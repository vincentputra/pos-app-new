import { CalendarDate } from "@internationalized/date";
import { ref } from "vue";

export const useDate = () => {
  const date = new Date();
  const now = new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  const dateRange = ref({
    start: now.subtract({ weeks: 1 }),
    end: now,
  });
  const yearNow = date.getFullYear();
  const monthNow = date.getMonth() + 1;
  const dayNow = date.getDate();

  const formatMonth = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
    }).format(new Date(date));
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeZone: "Asia/Jakarta",
    }).format(new Date(date));
  };

  const formatDateTime = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(date));
  };

  return {
    yearNow,
    monthNow,
    dayNow,
    dateRange,
    formatMonth,
    formatDate,
    formatDateTime,
  };
};
