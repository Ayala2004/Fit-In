import { useState } from "react";

export function useRecentActivityHistory(endpoint: string) {
  const [fullHistory, setFullHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const open = async () => {
    setLoadingHistory(true);
    setIsOpen(true);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      console.log("History response from", endpoint, data);
      setFullHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const close = () => setIsOpen(false);

  return {
    fullHistory,
    loadingHistory,
    isOpen,
    open,
    close,
  };
}
