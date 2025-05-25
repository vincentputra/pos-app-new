import { useRuntimeConfig } from "nuxt/app";

export const useImage = () => {
  const displayImage = (payload: string) => {
    const config = useRuntimeConfig();
    return `${config.public.apiBase}/files/${payload}`;
    /* try {
      const response = await fetch(
        `${config.public.apiBase}/files/${payload}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      return response;
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          "Unable to connect to the server. Please check your internet connection."
        );
      }
      throw error;
    } */
  };

  return { displayImage };
};
