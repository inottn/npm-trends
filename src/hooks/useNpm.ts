import { useQuery } from "@tanstack/react-query";

import { getAllVersions, getVersionDownloads } from "../services/npm";

export const npmKeys = {
  all: ["npm"] as const,
  versions: (pkg: string) => [...npmKeys.all, "versions", pkg] as const,
  downloads: (pkg: string) => [...npmKeys.all, "downloads", pkg] as const,
};

export function usePackageVersions(pkgName: string) {
  return useQuery({
    queryKey: npmKeys.versions(pkgName),
    queryFn: () => getAllVersions(pkgName),
    enabled: !!pkgName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePackageDownloads(pkgName: string) {
  return useQuery({
    queryKey: npmKeys.downloads(pkgName),
    queryFn: () => getVersionDownloads(pkgName),
    enabled: !!pkgName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
