import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Entry } from "../backend.d";
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
    }: {
      name: string;
      mobileNumber: string;
      amount: bigint;
      commission: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createEntry(name, mobileNumber, amount, commission);
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
    }: {
      id: string;
      name: string;
      mobileNumber: string;
      amount: bigint;
      commission: bigint;
      paid: boolean;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateEntry(
        id,
        name,
        mobileNumber,
        amount,
        commission,
        paid,
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}
