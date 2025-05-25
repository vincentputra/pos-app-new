export const usePrice = () => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  return { formatPrice };
};
