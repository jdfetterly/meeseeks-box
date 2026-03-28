# Technical Design Document

## 1. Document Control

- Feature / Initiative: `FEAT-000 App Shell, Navigation, and Fresh-Start Cutover` / `INIT-001 Meeseek Box Platform Foundation`
- Author: Codex
- Date: `2026-03-19`
- Status: `draft`
- Source FDD: `../fdd.md`

## 2. Context and Inputs

This feature defines the shared responsive shell the rest of Meeseek Box depends on. It also owns the fresh-start cutover from browser-local chat/Kanban truth to server-backed state.

## 3. Technical Goals

- Define one shared app-shell contract, route map, and drawer/sheet system.
- Define shared viewport profiles for desktop and iPhone browser validation.
- Disable or bypass browser-local truth paths in the existing Claw-Tower shell.

## 4. Architecture Overview

The feature adds:
- route and navigation skeleton
- desktop sidebar/activity rail pattern
- mobile bottom navigation pattern
- universal drawer/sheet entry contract
- viewport config used by UI code and Playwright
- cutover logic that removes browser-local truth from active flows

## 5. Interfaces and Contracts

- `AppShellContract`
- `ViewportProfile`
- route map for `Home`, `Work`, `Chat`, `Inbox`, and `More`
- universal drawer entry types for run, work item, conversation, artifact, memory, schedule, and agent

## 6. Test Strategy

- integration tests for route/nav shell wiring
- Playwright tests using shared desktop and iPhone viewport profiles
- manual iPhone smoke for launch and card inspection
