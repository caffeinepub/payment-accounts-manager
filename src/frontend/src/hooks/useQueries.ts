import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Entry } from "../backend.d";
import { removeCommissionType } from "../utils/commissionStorage";
import { getSecretParameter } from "../utils/urlParams";
import { useActor } from "./useActor";

async function ensureRegistered(actor: {
  _initializeAccessControlWithSecret: (token: string) => Promise<void>;
}) {
  const adminToken = getSecretParameter("caffeineAdminToken") || "";
  try {
    await actor._initializeAccessControlWithSecret(adminToken);
  } catch {
    // Already registered or initialization failed — continue
  }
}

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
      await ensureRegistered(actor);
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
      await ensureRegistered(actor);
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
      await ensureRegistered(actor);
      return actor.deleteEntry(id);
    },
    onSuccess: (_data, id) => {
      removeCommissionType(id);
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}
