# Planning Root

This directory is the working planning system for Meeseek Box using the `agent-workflow` operating model.

## Purpose

The planning area holds the project manifest, local workflow copy, local templates, initiative folders, and feature-level artifacts.

## Current Use

This repo is currently using the planning tree first for structured test planning and workflow bootstrap.

Primary source inputs for the initial backfill:
- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/meeseeks-box-plan-draft-v3.md`
- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/legacy/meeseeks-box-plan-draft-v2.md`
- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/legacy/plan-v2-change-summary.md`
- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/legacy/initialization/docs/`

## Structure

```text
planning/
  README.md
  project.md
  ai-first-north-star.md
  ai-first-reality-framework.md
  archive/
  _workflow/
  _templates/
  initiatives/
```

## Working Rule

Until formal FDD and TDD artifacts are fully backfilled, the files in this tree should be treated as draft planning artifacts derived from the current Meeseek Box design documents.

## Directional Docs

- `ai-first-north-star.md` defines the product north star and design test.
- `ai-first-reality-framework.md` translates that north star into product consequences and design guidance.
- `chat-briefs/meeseek-box-functional-spec-rev-a.md` is the active Rev-A product contract.
- `archive/` preserves historical planning inputs that should not be treated as active implementation instructions.

## Retired Mobile Split

The standalone `/Users/jdfetterly/Products/meeseeks-box/meeseeks-mobile` app is retired. It was an exploratory split and is not the active mobile product surface.

The canonical mobile implementation is the parent-repo `/mobile` route backed by `app/mobile/page.tsx` and `components/mobile/*`. Do not use the old split app or its light chat UI for design validation, screenshots, QA, or implementation guidance.

The desktop shell remains a possible future surface. Retiring the split mobile folder does not retire the parent repo's desktop routes; it only prevents the old standalone mobile experiment from being mistaken for the current phone UI.
