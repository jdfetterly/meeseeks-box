// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { getProductStatePaths } from '@/lib/product-state/config';

describe('getProductStatePaths', () => {
  it('uses the repo-local default when no override is set', () => {
    const rootDir = '/tmp/meeseeks-box-test';
    const paths = getProductStatePaths(rootDir);

    expect(paths.dataDir).toBe('/tmp/meeseeks-box-test/.meeseeks-box');
    expect(paths.dbPath).toBe('/tmp/meeseeks-box-test/.meeseeks-box/state.sqlite');
  });

  it('uses the configured state directory override', () => {
    process.env.MEESEEKS_BOX_STATE_DIR = '/tmp/custom-state-dir';

    const paths = getProductStatePaths('/tmp/ignored-root');

    expect(paths.dataDir).toBe('/tmp/custom-state-dir');
    expect(paths.dbPath).toBe('/tmp/custom-state-dir/state.sqlite');

    delete process.env.MEESEEKS_BOX_STATE_DIR;
  });
});
