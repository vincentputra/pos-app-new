import { useRuntimeConfig } from "nuxt/app";

export const useImage = () => {
  const displayImage = (payload: string) => {
    const config = useRuntimeConfig();
    return `${config.public.apiBase}/files/${payload}`;
  };

  return { displayImage };
};
