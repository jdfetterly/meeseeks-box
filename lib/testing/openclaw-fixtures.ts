export const liveRunCompletionFixture = {
  command:
    "openclaw agent --agent mini-ops --message 'Discovery fixture capture only. Reply exactly DISCOVERY_OK.' --json",
  runId: 'a6c8d37d-42f0-4c57-b2ab-319687a812a0',
  status: 'ok',
  summary: 'completed',
  sessionKey: 'agent:mini-ops:main',
  resultText: 'DISCOVERY_OK',
  provider: 'openrouter',
  model: 'openai/gpt-5.4',
} as const

export const liveToolFailureFixture = {
  command:
    "openclaw agent --agent mini-ops --message 'Discovery fixture capture only. Attempt to read /Users/agent-playground/code/workspaces/mini-ops/DOES_NOT_EXIST and then reply exactly TOOL_FAILURE_CAPTURED.' --json",
  runId: '949df8b5-9038-47f0-a0b8-9a74ec4729b3',
  status: 'ok',
  summary: 'completed',
  sessionKey: 'agent:mini-ops:main',
  resultText: 'TOOL_FAILURE_CAPTURED',
  logLine:
    "[tools] read failed: ENOENT: no such file or directory, access '/Users/agent-playground/code/workspaces/mini-ops/DOES_NOT_EXIST'",
} as const

export const liveScheduleTriggerFixture = {
  createCommand:
    "openclaw cron add --name 'meeseeks-box-discovery-schedule' --agent mini-ops --session isolated --message 'Discovery fixture capture only. Reply exactly SCHEDULE_TRIGGER_CAPTURED.' --at '10s' --delete-after-run --no-deliver --json",
  runsCommand:
    'openclaw cron runs --id b71242d1-8e59-46b7-8c1c-a9632a15e85d --limit 5 --json',
  jobId: 'b71242d1-8e59-46b7-8c1c-a9632a15e85d',
  sessionId: 'fae6bca6-e3c4-41a4-bdf7-053af7b6e170',
  sessionKey:
    'agent:mini-ops:cron:b71242d1-8e59-46b7-8c1c-a9632a15e85d:run:fae6bca6-e3c4-41a4-bdf7-053af7b6e170',
  action: 'finished',
  status: 'ok',
  summary: 'SCHEDULE_TRIGGER_CAPTURED',
  scheduleKind: 'at',
  deliveryMode: 'none',
  deleteAfterRun: true,
  provider: 'openrouter',
  model: 'openai/gpt-5.4',
} as const
