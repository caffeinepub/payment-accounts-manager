import { useCallback, useEffect, useState } from "react";
import {
  type CommissionType,
  getCommissionTypeMap,
  removeCommissionType as removeCommissionTypeStorage,
  setCommissionType as setCommissionTypeStorage,
} from "../utils/commissionStorage";

export function useCommissionTypeMap() {
  const [map, setMap] = useState<Record<string, CommissionType>>(() =>
    getCommissionTypeMap(),
  );

  // Refresh map from localStorage when storage changes (e.g., other tabs)
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === "commissionTypeMap") {
        setMap(getCommissionTypeMap());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setType = useCallback((id: string, type: CommissionType) => {
    setCommissionTypeStorage(id, type);
    setMap(getCommissionTypeMap());
  }, []);

  const removeType = useCallback((id: string) => {
    removeCommissionTypeStorage(id);
    setMap(getCommissionTypeMap());
  }, []);

  const refresh = useCallback(() => {
    setMap(getCommissionTypeMap());
  }, []);

  return { map, setType, removeType, refresh };
}
