import { useQuery } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

export const usePreviewQuery = <T>(
  queryKey: QueryKey,
  idToken: string | null,
  loader: (token: string) => Promise<T>,
  previewData: T,
) =>
  useQuery({
    queryKey: [...queryKey, idToken ? "live" : "preview"],
    queryFn: () => (idToken ? loader(idToken) : Promise.resolve(previewData)),
  });
