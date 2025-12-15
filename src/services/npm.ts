import semver from "semver";

const REGISTRY_URL = "https://registry.npmmirror.com";

// User specified endpoint for bulk version stats
const STATS_API_BASE = "https://api.npmjs.org/versions";

export async function getAllVersions(pkgName: string): Promise<string[]> {
  try {
    const response = await fetch(`${REGISTRY_URL}/${encodeURIComponent(pkgName)}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Package "${pkgName}" not found.`);
      throw new Error(`Failed to fetch package versions: ${response.statusText}`);
    }
    const data = await response.json();
    // registry.npmmirror.com returns full document with 'versions' object
    const versions = Object.keys(data.versions || {});

    // Sort descending
    return versions.sort((a, b) => semver.compare(b, a));
  } catch (error: unknown) {
    console.error("Registry fetch error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to connect to NPM registry.");
  }
}

export async function getVersionDownloads(pkgName: string): Promise<Record<string, number>> {
  const encodedPkg = encodeURIComponent(pkgName);
  const url = `${STATS_API_BASE}/${encodedPkg}/last-week`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // If 404, it might mean no data or package not found on stats server
      if (response.status === 404) return {};
      throw new Error(`Stats API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle potential response formats
    // If the API returns { downloads: { "1.0.0": 123 } }
    if (data && data.downloads && typeof data.downloads === "object") {
      return data.downloads;
    }

    // If the API returns { "1.0.0": 123 } directly
    return data || {};
  } catch (error: unknown) {
    console.error("Failed to fetch version downloads:", error);
    // We don't want to crash the whole app if stats fail, but we should probably inform.
    // However, returning empty map allows the app to show 0 downloads which is safer than white screen.
    // The UI will show 0 downloads.
    throw error;
  }
}
