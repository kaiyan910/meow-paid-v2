import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { profileRowSchema } from "@/schemas/api.schema";
import type { ProfileFormValues } from "@/schemas/profile.schema";

const PROFILE_KEY = ["profile"] as const;

/** Fetches the current user's profile. */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => apiFetch("/api/profile", profileRowSchema),
  });
}

/** Fetches the profiles available for the payee dropdown. */
export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: () => apiFetch("/api/profile?list=1", profileRowSchema.array()),
  });
}

/** Updates the current user's profile. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileFormValues) =>
      apiFetch("/api/profile", profileRowSchema, { method: "PATCH", body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      void queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}
