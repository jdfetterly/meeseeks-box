#!/usr/bin/env node

const HELP_TEXT = `Report a scheduled job output file to Meeseek Box.

Usage:
  npm run report-schedule-output -- --schedule <schedule-id> --file <workspace-file-path> [options]

Options:
  --schedule <id>       Canonical Meeseek Box schedule id (required)
  --file <path>         Absolute or workspace-relative output file path (required)
  --slot <name>         Stable output slot, for example "weekly-brief"
  --title <value>       Optional artifact family title override
  --reported-at <iso>   Optional explicit report timestamp
  --base-url <url>      Meeseek Box base URL (default: MEESEEKS_BOX_BASE_URL or http://127.0.0.1:3000)
  --json                Print the full JSON response
  --help                Show this message
`

function parseArgs(argv) {
  const result = {
    schedule: null,
    file: null,
    slot: null,
    title: null,
    reportedAt: null,
    baseUrl: process.env.MEESEEKS_BOX_BASE_URL || 'http://127.0.0.1:3000',
    json: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--help' || token === '-h') {
      console.log(HELP_TEXT)
      process.exit(0)
    }

    if (token === '--json') {
      result.json = true
      continue
    }

    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`)
    }

    const key = token.slice(2)
    const value = argv[index + 1]

    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }

    index += 1

    switch (key) {
      case 'schedule':
        result.schedule = value
        break
      case 'file':
        result.file = value
        break
      case 'slot':
        result.slot = value
        break
      case 'title':
        result.title = value
        break
      case 'reported-at':
        result.reportedAt = value
        break
      case 'base-url':
        result.baseUrl = value
        break
      default:
        throw new Error(`Unknown argument: --${key}`)
    }
  }

  if (!result.schedule || !result.file) {
    throw new Error('Both --schedule and --file are required')
  }

  return result
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2))
    const endpoint = new URL(
      `/api/product-state/schedules/${args.schedule}/report-output`,
      args.baseUrl.endsWith('/') ? args.baseUrl : `${args.baseUrl}/`,
    )

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filePath: args.file,
        outputSlot: args.slot,
        title: args.title,
        reportedAt: args.reportedAt,
      }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        payload && typeof payload.error === 'string'
          ? payload.error
          : `Request failed with status ${response.status}`
      throw new Error(message)
    }

    if (args.json) {
      console.log(JSON.stringify(payload, null, 2))
      return
    }

    console.log(`Reported ${payload.registration.version.name} for schedule ${args.schedule}`)
    console.log(`Artifact family: ${payload.registration.family.id}`)
    console.log(`Artifact version: ${payload.registration.version.versionLabel}`)
    console.log(`Schedule status: ${payload.scheduleSummary.status}`)
    console.log(
      `Last success: ${payload.scheduleSummary.lastSuccessfulOutputAt ?? 'none'}`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    console.error('')
    console.error(HELP_TEXT)
    process.exit(1)
  }
}

await main()
