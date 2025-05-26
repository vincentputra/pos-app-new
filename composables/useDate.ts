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
  const formatDateTime = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return { dateRange, formatDateTime };
};
