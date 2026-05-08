export const toast = {
  success: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pulsesend:toast", { detail: { type: "success", message } }));
    }
  },
  error: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pulsesend:toast", { detail: { type: "error", message } }));
    }
  },
  info: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pulsesend:toast", { detail: { type: "info", message } }));
    }
  }
};
