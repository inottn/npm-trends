export type Language = "en" | "zh";

export interface Translation {
  // App
  appTitle: string;
  configTitle: string;
  analyzeBtn: string;
  processingBtn: string;
  waitingTitle: string;
  waitingDesc: string;
  errorTitle: string;
  vizTitle: string;
  reportTitle: string;
  downloadsLabel: string;
  shareLabel: string;
  topVerLabel: string;
  allVersions: string;
  // RangeBuilder
  quickAddTitle: string;
  pkgPlaceholder: string;
  byMajor: string;
  byMinor: string;
  pkgInputPlaceholder: string;
  startPlaceholder: string;
  endPlaceholder: string;
  minBadge: string;
  maxBadge: string;
  setToMin: string;
  setToMax: string;
  addRow: string;
  reset: string;
  mergeBtn: string; // New
  mergeError: string; // New
  noRanges: string;
  // StatsChart
  chartTitle: string;
  chartDownloads: string;
  // VersionSelect
  noVersions: string;
  // Dropdown options
  optionAll: string;
}

export const dictionary: Record<Language, Translation> = {
  en: {
    appTitle: "NPM Trends",
    configTitle: "Configuration",
    analyzeBtn: "ANALYZE DATA",
    processingBtn: "PROCESSING",
    waitingTitle: "WAITING FOR INPUT",
    waitingDesc: "Define your package version ranges on the left to generate the analysis report.",
    errorTitle: "SYSTEM ERROR",
    vizTitle: "Visualization",
    reportTitle: "Detailed Report",
    downloadsLabel: "Downloads (7D)",
    shareLabel: "Share",
    topVerLabel: "Top Ver.",
    allVersions: "All Versions",
    quickAddTitle: "Quick Add",
    pkgPlaceholder: "Package name...",
    byMajor: "By Major",
    byMinor: "Minors (Latest Major)",
    pkgInputPlaceholder: "PKG",
    startPlaceholder: "Start",
    endPlaceholder: "End",
    minBadge: "Min",
    maxBadge: "Max",
    setToMin: "Set to Min",
    setToMax: "Set to Max",
    addRow: "Add Row",
    reset: "Reset",
    mergeBtn: "Merge Selected",
    mergeError: "Select multiple ranges of the same package",
    noRanges: "No ranges defined.",
    chartTitle: "Downloads Distribution",
    chartDownloads: "Downloads",
    noVersions: "No matching versions",
    optionAll: "All",
  },
  zh: {
    appTitle: "NPM 趋势",
    configTitle: "配置",
    analyzeBtn: "开始分析",
    processingBtn: "处理中",
    waitingTitle: "等待输入",
    waitingDesc: "请在左侧定义包版本范围以生成分析报告。",
    errorTitle: "系统错误",
    vizTitle: "可视化",
    reportTitle: "详细报告",
    downloadsLabel: "下载量 (7天)",
    shareLabel: "占比",
    topVerLabel: "最高版本",
    allVersions: "所有版本",
    quickAddTitle: "快速添加",
    pkgPlaceholder: "输入包名...",
    byMajor: "按主版本",
    byMinor: "最新主版本次版本",
    pkgInputPlaceholder: "包名",
    startPlaceholder: "起始",
    endPlaceholder: "结束",
    minBadge: "最小",
    maxBadge: "最大",
    setToMin: "设为最小",
    setToMax: "设为最大",
    addRow: "添加行",
    reset: "重置",
    mergeBtn: "合并选中",
    mergeError: "请选择同一包的多个范围",
    noRanges: "尚未定义范围。",
    chartTitle: "下载量分布",
    chartDownloads: "下载量",
    noVersions: "无匹配版本",
    optionAll: "全部",
  },
};
