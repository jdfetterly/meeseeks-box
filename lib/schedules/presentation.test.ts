import { describe, expect, it } from 'vitest';
import {
  describeSchedulePurpose,
  describeScheduleUsefulness,
} from '@/lib/schedules/presentation';

describe('schedule presentation helpers', () => {
  it('prefers explicit output expectation when describing purpose', () => {
    expect(
      describeSchedulePurpose({
        metadata: {
          outputExpectation: 'Deliver a weekly project digest into Review Queue.',
          prompt: 'Draft a digest.',
        },
      }),
    ).toBe('Deliver a weekly project digest into Review Queue.');
  });

  it('falls back to prompt when no output expectation exists', () => {
    expect(
      describeSchedulePurpose({
        metadata: {
          prompt: 'Summarize project drift.',
        },
      }),
    ).toBe('Summarize project drift.');
  });

  it('marks schedules with failures or missed runs as unclear value', () => {
    expect(
      describeScheduleUsefulness({
        missedRun: false,
        consecutiveFailureCount: 2,
        lastSuccessfulOutputAt: '2026-03-26T16:00:00.000Z',
      }),
    ).toBe('unclear value');
  });

  it('marks schedules with successful output as useful', () => {
    expect(
      describeScheduleUsefulness({
        missedRun: false,
        consecutiveFailureCount: 0,
        lastSuccessfulOutputAt: '2026-03-26T16:00:00.000Z',
      }),
    ).toBe('useful');
  });

  it('marks schedules without signal yet as review value', () => {
    expect(
      describeScheduleUsefulness({
        missedRun: false,
        consecutiveFailureCount: 0,
        lastSuccessfulOutputAt: null,
      }),
    ).toBe('review value');
  });
});
