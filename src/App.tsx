import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import {
  Loader2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Moon,
  Sun,
  Share2,
  Check,
} from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import semver from "semver";

import type { VersionRange, AnalysisState, RangeResult } from "./types";

import RangeBuilder from "./components/RangeBuilder";
import StatsChart from "./components/StatsChart";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { npmKeys } from "./hooks/useNpm";
import { dictionary, type Language } from "./services/i18n";
import { getAllVersions, getVersionDownloads } from "./services/npm";

// Removed default values as requested
const DEFAULT_RANGES: VersionRange[] = [];

type Theme = "light" | "dark";

export default function App() {
  const queryClient = useQueryClient();
  const [lang, setLang] = useLocalStorage<Language>("npm-trends-lang", "en");
  const [theme, setTheme] = useLocalStorage<Theme>("npm-trends-theme", "light");
  const t = dictionary[lang];

  const [ranges, setRanges] = useState<VersionRange[]>(DEFAULT_RANGES);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [shouldAutoAnalyze, setShouldAutoAnalyze] = useState(false);

  const [state, setState] = useState<AnalysisState>({
    status: "idle",
    results: [],
    processedCount: 0,
    totalToProcess: 0,
  });

  // Handle Theme Change
  useLayoutEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Load ranges from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rangesParam = params.get("ranges");
    if (rangesParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(rangesParam));
        if (Array.isArray(decoded) && decoded.length > 0) {
          setRanges(decoded);
          setShouldAutoAnalyze(true);
        }
      } catch (e) {
        console.error("Failed to parse ranges from URL", e);
      }
    }
  }, []);

  const handleShareLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("ranges", encodeURIComponent(JSON.stringify(ranges)));
      await navigator.clipboard.writeText(url.toString());
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  const cleanVer = (v: string) => {
    const cleaned = semver.clean(v);
    if (cleaned) return cleaned;
    const coerced = semver.coerce(v);
    return coerced ? coerced.version : null;
  };

  // --- Logic for Quick Generator ---
  const handleQuickAdd = async (
    packageName: string,
    type: "majors" | "minors",
    limit?: number | "all",
  ) => {
    const trimmedName = packageName.trim();
    if (!trimmedName) return;

    // Ensure we have versions
    let versions: string[] = [];
    try {
      versions = await queryClient.ensureQueryData({
        queryKey: npmKeys.versions(trimmedName),
        queryFn: () => getAllVersions(trimmedName),
      });
    } catch (e) {
      console.error(`Failed to load versions for ${trimmedName}`, e);
      return;
    }

    if (versions.length === 0) return; // Could not fetch

    const newRanges: VersionRange[] = [];

    if (type === "majors") {
      const majors = new Set<number>();
      versions.forEach((v: string) => {
        const parsed = semver.coerce(v);
        if (parsed) majors.add(parsed.major);
      });
      const sortedMajors = Array.from(majors).sort((a, b) => a - b);

      sortedMajors.forEach((major, idx) => {
        const isLast = idx === sortedMajors.length - 1;
        newRanges.push({
          id: Math.random().toString(36).substring(7),
          packageName: trimmedName,
          start: `${major}.0.0`,
          end: `${major + 1}.0.0`,
          isMax: isLast,
          isMin: false,
        });
      });
    } else if (type === "minors") {
      // Find latest major
      const latest = versions[0]; // versions are sorted descending
      const parsedLatest = semver.coerce(latest);

      if (parsedLatest) {
        const targetMajor = parsedLatest.major;
        const minors = new Set<number>();

        versions.forEach((v: string) => {
          const parsed = semver.coerce(v);
          if (parsed && parsed.major === targetMajor) {
            minors.add(parsed.minor);
          }
        });

        const sortedMinors = Array.from(minors).sort((a, b) => a - b);

        // Handle limit
        let recentMinors = sortedMinors;
        if (limit !== "all") {
          const count = typeof limit === "number" ? limit : 5;
          recentMinors = sortedMinors.slice(-count);
        }

        recentMinors.forEach((minor, idx) => {
          const isLast = idx === recentMinors.length - 1;
          const nextMinor = recentMinors[idx + 1];

          newRanges.push({
            id: Math.random().toString(36).substring(7),
            packageName: trimmedName,
            start: `${targetMajor}.${minor}.0`,
            end: nextMinor ? `${targetMajor}.${nextMinor}.0` : "",
            isMax: isLast,
            isMin: false,
          });
        });
      }
    }

    setRanges((prev) => [...prev, ...newRanges]);
  };

  const handleAnalyze = async () => {
    if (ranges.length === 0) return;

    setState({
      status: "loading",
      results: [],
      processedCount: 0,
      totalToProcess: 0,
    });

    try {
      // 1. Identify unique packages
      const uniquePackages = Array.from(new Set(ranges.map((r) => r.packageName).filter(Boolean)));

      // 2. Fetch data for all packages in parallel
      const packageDataPromises = uniquePackages.map(async (pkg) => {
        const [versions, downloads] = await Promise.all([
          queryClient.ensureQueryData({
            queryKey: npmKeys.versions(pkg),
            queryFn: () => getAllVersions(pkg),
          }),
          queryClient.ensureQueryData({
            queryKey: npmKeys.downloads(pkg),
            queryFn: () => getVersionDownloads(pkg),
          }),
        ]);
        return { pkg, versions, downloads };
      });

      const packageDataList = await Promise.all(packageDataPromises);

      // Map for easy lookup: pkg -> { versions, downloads }
      const dataMap: Record<string, { versions: string[]; downloads: Record<string, number> }> = {};
      packageDataList.forEach((item) => {
        dataMap[item.pkg] = {
          versions: item.versions,
          downloads: item.downloads,
        };
      });

      // 3. Process each range against its package data
      let grandTotalDownloads = 0;
      const tempResults: RangeResult[] = [];

      for (const range of ranges) {
        if (!range.packageName || !dataMap[range.packageName]) continue;

        const { versions: allVersions, downloads: statsMap } = dataMap[range.packageName];
        const matchingVersions: string[] = [];

        // Determine Start Logic
        const start = cleanVer(range.start);
        const isMin = range.isMin || !start; // Explicit flag OR empty input means Min

        // Determine End Logic
        const end = cleanVer(range.end);
        const isMax = range.isMax || !end; // Explicit flag OR empty input means Max

        for (const ver of allVersions) {
          if (!semver.valid(ver)) continue;

          let matchesStart = true;
          let matchesEnd = true;

          // Check Start (if not min, verify gte)
          if (!isMin && start) {
            matchesStart = semver.gte(ver, start);
          }

          // Check End (if not max, verify lt)
          if (!isMax && end) {
            matchesEnd = semver.lt(ver, end);
          }

          if (matchesStart && matchesEnd) {
            matchingVersions.push(ver);
          }
        }

        let rangeTotal = 0;
        let topVer = { version: "", downloads: -1 };

        if (matchingVersions.length > 0) {
          rangeTotal = matchingVersions.reduce((sum, ver) => {
            const d = statsMap[ver] || 0;
            if (d > topVer.downloads) {
              topVer = { version: ver, downloads: d };
            }
            return sum + d;
          }, 0);
        }

        grandTotalDownloads += rangeTotal;

        // Generate Label
        let label = "";
        if (isMin && isMax) label = t.allVersions;
        else if (isMin) label = `< ${end}`;
        else if (isMax) label = `>= ${start}`;
        else label = `${start} - ${end}`;

        tempResults.push({
          rangeId: range.id,
          packageName: range.packageName,
          rangeLabel: label,
          totalDownloads: rangeTotal,
          percentage: 0,
          versionCount: matchingVersions.length,
          versions: matchingVersions,
          topVersion: topVer.downloads > -1 ? topVer : undefined,
        });
      }

      // 4. Calculate final percentages
      const finalResults = tempResults.map((r) => ({
        ...r,
        percentage: grandTotalDownloads > 0 ? (r.totalDownloads / grandTotalDownloads) * 100 : 0,
      }));

      setState({
        status: "success",
        results: finalResults,
        processedCount: finalResults.length,
        totalToProcess: finalResults.length,
      });
    } catch (err: unknown) {
      console.error(err);
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "An unexpected error occurred.",
      }));
    }
  };

  // Auto-analyze when loaded from URL
  useEffect(() => {
    if (shouldAutoAnalyze && ranges.length > 0) {
      setShouldAutoAnalyze(false);
      handleAnalyze();
    }
  }, [shouldAutoAnalyze, ranges]);

  const focusClass =
    "outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 rounded-sm";

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto p-6 md:p-12">
        <header className="mb-12 border-b border-neutral-900 dark:border-neutral-100 pb-6 flex items-baseline justify-between transition-colors duration-300">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black dark:text-white uppercase transition-colors duration-300">
            {t.appTitle}
            <span className="text-accent">.</span>
          </h1>

          <div className="flex items-center gap-6">
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={clsx(
                "text-neutral-400 hover:text-black dark:hover:text-white transition-colors duration-300 p-1",
                focusClass,
              )}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? (
                <Moon size={18} strokeWidth={2.5} />
              ) : (
                <Sun size={18} strokeWidth={2.5} />
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLang("en")}
                className={`text-xs font-bold ${
                  lang === "en"
                    ? "text-black dark:text-white"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                } transition-colors duration-300 ${focusClass} px-1`}
              >
                EN
              </button>
              <div className="w-px h-3 bg-neutral-200 dark:bg-neutral-800 transition-colors duration-300"></div>
              <button
                onClick={() => setLang("zh")}
                className={`text-xs font-bold ${
                  lang === "zh"
                    ? "text-black dark:text-white"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                } transition-colors duration-300 ${focusClass} px-1`}
              >
                中文
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-4 space-y-8">
            <div className="border border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
              <div className="bg-neutral-100 dark:bg-neutral-900 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors duration-300">
                {t.configTitle}
              </div>
              <RangeBuilder
                ranges={ranges}
                onChange={setRanges}
                onQuickAdd={handleQuickAdd}
                disabled={state.status === "loading"}
                translations={t}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={state.status === "loading" || !ranges.some((r) => r.packageName.trim())}
              className="w-full h-14 bg-black enabled:hover:bg-neutral-800 dark:bg-white dark:text-black enabled:dark:hover:bg-neutral-200 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-colors duration-300 flex justify-center items-center gap-4 outline-none focus-visible:ring-4 focus-visible:ring-accent/50 dark:focus-visible:ring-white/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
            >
              {state.status === "loading" ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {t.processingBtn}
                </>
              ) : (
                <>
                  {t.analyzeBtn}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 min-h-[500px]">
            {state.status === "idle" && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 transition-colors duration-300">
                <TrendingUp
                  size={48}
                  className="text-neutral-300 dark:text-neutral-700 mb-6"
                  strokeWidth={1}
                />
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white transition-colors duration-300">
                  {t.waitingTitle}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-xs text-sm transition-colors duration-300">
                  {t.waitingDesc}
                </p>
              </div>
            )}

            {state.status === "error" && (
              <div className="bg-neutral-50 dark:bg-neutral-900/50 border-l-4 border-red-600 p-6 flex items-start gap-4 transition-colors duration-300">
                <AlertTriangle className="text-red-600" size={24} />
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white transition-colors duration-300">
                    {t.errorTitle}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-1 font-mono text-sm transition-colors duration-300">
                    {state.error}
                  </p>
                </div>
              </div>
            )}

            {state.status === "success" && (
              <div className="space-y-12 animate-in fade-in duration-500">
                {/* Chart Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2 transition-colors duration-300">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 transition-colors duration-300">
                      {t.vizTitle}
                    </h2>
                    <button
                      className={clsx(
                        "px-3 py-1.5 bg-white dark:bg-neutral-950 text-neutral-400 dark:text-neutral-400 enabled:hover:text-black enabled:dark:hover:text-white text-xs font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        focusClass,
                      )}
                      disabled={ranges.length === 0}
                      title={t.shareLinkBtn}
                      onClick={handleShareLink}
                    >
                      {copyStatus === "copied" ? (
                        <>
                          <Check size={14} />
                          <span className="hidden sm:inline">{t.shareLinkCopied}</span>
                        </>
                      ) : copyStatus === "error" ? (
                        <>
                          <AlertTriangle size={14} />
                          <span className="hidden sm:inline">{t.shareLinkError}</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={14} />
                          <span className="hidden sm:inline">{t.shareLinkBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900 transition-colors duration-300">
                    <StatsChart data={state.results} translations={t} theme={theme} />
                  </div>
                </div>

                {/* Data Grid */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 pb-2 transition-colors duration-300">
                    {t.reportTitle}
                  </h2>

                  <div className="border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 transition-colors duration-300">
                    {state.results.map((res) => (
                      <div
                        key={res.rangeId}
                        className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-center"
                      >
                        {/* Package & Range Info */}
                        <div className="md:col-span-4">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-lg font-bold text-black dark:text-white transition-colors duration-300">
                              {res.packageName}
                            </span>
                          </div>
                          <div className="inline-block bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs font-mono font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition-colors duration-300">
                            {res.rangeLabel}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="md:col-span-4 md:text-right">
                          <div className="text-3xl font-black text-black dark:text-white tracking-tight transition-colors duration-300">
                            {new Intl.NumberFormat().format(res.totalDownloads)}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1 transition-colors duration-300">
                            {t.downloadsLabel}
                          </div>
                        </div>

                        {/* Percentage */}
                        <div className="md:col-span-2 md:text-right">
                          <div className="text-xl font-bold text-neutral-900 dark:text-white transition-colors duration-300">
                            {res.percentage.toFixed(1)}%
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1 transition-colors duration-300">
                            {t.shareLabel}
                          </div>
                        </div>

                        {/* Top Version */}
                        <div className="md:col-span-2 text-right">
                          {res.topVersion ? (
                            <>
                              <div className="font-mono text-sm font-semibold text-accent dark:text-blue-400 transition-colors duration-300">
                                {res.topVersion.version}
                              </div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1 transition-colors duration-300">
                                {t.topVerLabel}
                              </div>
                            </>
                          ) : (
                            <span className="text-neutral-300 transition-colors duration-300">
                              -
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
