import path from 'node:path';

export interface ProductStatePaths {
  dataDir: string;
  dbPath: string;
}

export function getProductStatePaths(rootDir = process.cwd()): ProductStatePaths {
  const dataDir =
    process.env.MEESEEKS_BOX_STATE_DIR?.trim() ||
    path.join(rootDir, '.meeseeks-box');

  return {
    dataDir,
    dbPath: path.join(dataDir, 'state.sqlite'),
  };
}
