export const useDate = () => {
  const formatDateTime = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return { formatDateTime };
};
