Claw-Tower is now running on the Mac mini as the canonical writable fork of clawport-ui, with repo-local governance in
  place so agent contribution is branch/PR-only and human merge authority remains with you. The mini runtime is under agent-
  playground, OpenClaw profile cleanup was completed to the Option B model (jd-personal, mini-ops, main fallback), and the
  dashboard is now reachable tailnet-only through Tailscale Serve at the mini’s Tailnet HTTPS URL. The app is running in
  production mode on loopback, and the Claw-Tower repo on the mini is configured with origin=jdfetterly/claw-tower and
  upstream=JohnRiceML/clawport-ui. We also merged the governance baseline to main, protected main, and confirmed the agent
  identity can contribute without holding merge authority.

  From a runtime and UX perspective, the system is partly centralized and partly device-local. The shared/live parts are
  working off the mini: the map/dashboard view, activity/logs, crons, memory browser, and cost views all pull data from
  server-backed APIs on the mini and should therefore present broadly the same state across MacBook, iPhone, and iPad. The
  local-only parts are more important than they first appear: chat history is currently stored in browser localStorage,
  Kanban tickets are also stored in browser localStorage, and settings/personalization such as operator name, portal
  branding, and avatar overrides are local to each browser as well. That means the current product experience is not truly
  “one dashboard across devices”; it is a hybrid where some panes reflect shared mini state and others are effectively per-
  device workspaces.

  While debugging the new chat UI, I confirmed that the core jd agent path was healthy end to end. Direct POSTs to /api/chat/
  jd streamed responses correctly, and the gateway path was functioning. The actual problem I found was in Claw-Tower’s
  client behavior around attachments: when you sent files, the UI resent attachment-heavy history on every subsequent turn,
  which causes payload growth and can make the chat feel hung or stuck after only a few files. I patched the local mini
  checkout to stop replaying old rich attachments on every request and to cap the amount of text-file content inlined into a
  request. That stabilized the immediate file-chat behavior, but the deeper finding is that chat persistence and context
  handling are still immature and local-first.

  The most important product-level finding is that if you want chat to persist across devices, the current implementation is
  insufficient. Right now, a conversation started on the MacBook will not show up on iPhone or iPad because the transcript is
  stored only in that browser’s local storage. I would treat “make chat persistent and shared across devices” as a first-
  class roadmap item, not a small polish task. A good v1 would move chat storage to the mini, add server-backed conversation
  APIs, preserve attachments and per-thread metadata, and create a foundation for future context management such as
  summaries, pinned context, file reference reuse, and thread-level memory controls. You’ve also raised the right adjacent
  concern: we should assess every other nav item, because if the goal is a coherent cross-device operator console, we need a
  clear inventory of what is server-backed, what is browser-local, what should be shared, and what should remain personal/
  session-scoped.

  So I agree this is likely a much larger design discussion. The next discussion should probably cover:

  - what “persistence” means for chat: per-device convenience vs canonical shared conversation history
  - whether Kanban should also become server-backed alongside chat
  - which nav items should be globally shared, operator-specific, or browser-local caches
  - how you want context managed over time: raw transcript retention, summaries, pinned memory, attachment retention, and
    archive/search behavior
  - whether Claw-Tower should evolve from a mostly stateless UI over OpenClaw into a true multi-surface control plane with
    durable product state
