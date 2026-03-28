export interface ProductStateCounts {
  conversations: number;
  messages: number;
  projects: number;
  specs: number;
  workItems: number;
  runs: number;
  runEvents: number;
  artifacts: number;
  approvals: number;
  reviewItems: number;
  schedules: number;
  memoryEntries: number;
  memorySources: number;
  savedLaunchPresets: number;
  launchDrafts: number;
}

export interface ProductStateHealth {
  dbPath: string;
  schemaVersion: number;
  counts: ProductStateCounts;
}
