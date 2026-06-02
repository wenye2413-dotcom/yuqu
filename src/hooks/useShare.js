import { useToast } from "./useToast";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL || window.location.origin;

export function useShare() {
  const toast = useToast();

  const share = async (title, text, path) => {
    const url = `${BASE_URL}/#${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast("链接已复制到剪贴板", "success");
      } catch {
        toast("复制失败，请手动复制链接", "error");
      }
    }
  };

  return { share };
}
