import { reactive } from "vue";
import { useStorage } from "@/composables/useStorage";

const storage = useStorage();
// Initialize history from storage or empty array if none exists
const history = reactive<string[]>(
  JSON.parse(storage.getItem("routeHistory") || "[]")
);

export function useHistory() {
  function addRoute(route: string) {
    history.push(route);
    // Save to storage whenever history changes
    storage.setItem("routeHistory", JSON.stringify(history));
  }

  function getPreviousRoute(stepsBack: number = 0) {
    return history.length > stepsBack
      ? history[history.length - stepsBack]
      : "/";
  }

  function clearHistory() {
    history.length = 0;
    storage.removeItem("routeHistory");
  }

  return { history, addRoute, getPreviousRoute, clearHistory };
}
