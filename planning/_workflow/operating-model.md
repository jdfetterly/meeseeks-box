# Operating Model

## Purpose

This workflow converts Meeseek Box design discussion and source docs into structured planning artifacts that can drive implementation without relying on chat memory.

## Core Hierarchy

Use:

`Project -> Initiative -> Feature -> Requirement`

Treat `feature` as the primary working unit for planning, design, delivery, testing, and bugs.

## Current Lifecycle for This Repo

1. Backfill requirements from the Meeseek Box draft documents.
2. Confirm requirement placement under the correct feature.
3. Build or update the FDD for each feature.
4. Stop for FDD approval.
5. Build or update the TDD for each feature.
6. Stop for TDD approval.
7. Build or update delivery artifacts.
8. Implement from the active delivery artifacts.

## Current Practical Note

This repo is early in the workflow adoption process. Some TDD-oriented testing artifacts are being created while formal FDD/TDD backfill is still in progress. These files should be treated as draft planning artifacts until the formal gates are completed.
