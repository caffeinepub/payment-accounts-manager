import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Entry, HistoryEntry } from "../backend.d";
import { removeCommissionSplit } from "../utils/commissionSplitStorage";
import { removeCommissionType } from "../utils/commissionStorage";
import { useActor } from "./useActor";

export function useGetEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<Entry[]>({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      mobileNumber,
      amount,
      commission,
      advance,
    }: {
      name: string;
      mobileNumber: string;
      amount: bigint;
      commission: bigint;
      advance: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createEntry(name, mobileNumber, amount, commission, advance);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useUpdateEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      mobileNumber,
      amount,
      commission,
      paid,
      advance,
    }: {
      id: string;
      name: string;
      mobileNumber: string;
      amount: bigint;
      commission: bigint;
      paid: boolean;
      advance: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateEntry(
        id,
        name,
        mobileNumber,
        amount,
        commission,
        paid,
        advance,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteEntry(id);
    },
    onSuccess: (_data, id) => {
      removeCommissionType(id);
      removeCommissionSplit(id);
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useMoveEntryToHistory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.moveEntryToHistory(id);
    },
    onSuccess: (_data, id) => {
      removeCommissionType(id);
      removeCommissionSplit(id);
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
      void queryClient.invalidateQueries({ queryKey: ["historyEntries"] });
    },
  });
}

export function useGetHistoryEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<HistoryEntry[]>({
    queryKey: ["historyEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHistoryEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteHistoryEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteHistoryEntry(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["historyEntries"] });
    },
  });
}
