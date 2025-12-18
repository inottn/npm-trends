import type { VersionRange } from "../types";

/**
 * Compress ranges array to a compact URL-safe string
 * Format: Each range is separated by ';'
 * Each range: packageName|start|end|flags
 * Flags: m=isMin, x=isMax
 */
export function compressRanges(ranges: VersionRange[]): string {
  return ranges
    .map((r) => {
      const parts = [r.packageName, r.start || "", r.end || ""];
      const flags = [];
      if (r.isMin) flags.push("m");
      if (r.isMax) flags.push("x");
      if (flags.length > 0) {
        parts.push(flags.join(""));
      }
      return parts.join("|");
    })
    .join(";");
}

/**
 * Decompress URL string back to ranges array
 */
export function decompressRanges(compressed: string): VersionRange[] {
  if (!compressed) return [];

  return compressed.split(";").map((part, index) => {
    const [packageName, start, end, flags = ""] = part.split("|");
    return {
      id: `${packageName}-${index}`,
      packageName,
      start: start || "",
      end: end || "",
      isMin: flags.includes("m"),
      isMax: flags.includes("x"),
    };
  });
}
