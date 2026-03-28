# AI-First UX Skill Design

- Artifact: Skill design
- Status: `draft`
- Date: `2026-03-25`
- Replaces: `~/.codex/skills/upgrade-ai-ux`

## Recommendation

Replace the current `upgrade-ai-ux` skill with a new skill focused on AI-first product UX review and redesign guidance.

Recommended new skill name:

- `ai-first-product-ux`

This name is narrower and more accurate than `upgrade-ai-ux`.
It makes the trigger about product interaction model quality, not generic UX polish.

## Why Replace The Current Skill

The current skill is good at:

- auditing existing products
- inferring JTBD and friction
- evolving an existing design system
- generating structured upgrade briefs

It is weak at:

- evaluating whether a product is truly AI-first
- detecting when chat is bolted on instead of being the control plane
- rejecting form-first and dashboard-first interaction models
- reasoning about project memory, plan-to-card flows, review-centered completion, and adaptive behavior
- grounding recommendations in a specific north star and design test

The current skill optimizes for `better UX`.
The replacement should optimize for `AI-first interaction model correctness`.

## What To Reuse From The Existing Skill

Keep and adapt these ideas:

- direct product inspection first
- behavior and JTBD inference
- design-system-aware evolution instead of unnecessary visual reinvention
- structured deliverables with evidence, diagnosis, and prioritized recommendations

Keep these references conceptually, though some should be rewritten:

- `references/behavior-jtbd.md`
- `references/ai-interaction-patterns.md`
- `references/design-system-evolution.md`
- `references/deliverable-template.md`

## What Must Change

### New Core Purpose

The new skill should answer:

- is this surface actually AI-first?
- where does it drift back into traditional app behavior?
- how should it be redesigned so the user expresses intent and the system drives setup, execution, and review?

### New Evaluation Standard

The skill must be grounded in the Meeseek Box north star:

- intent to outcome
- conversation before configuration
- projects before operational state
- reviewable outcomes before status tracking
- visible memory and adaptive behavior
- forms as fallback

It should explicitly use the design test from:

- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/planning/ai-first-north-star.md`
- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/planning/ai-first-reality-framework.md`

### New Primary Failure Modes To Detect

The replacement skill should detect:

- chat as a separate page instead of control plane
- create-first forms before intent capture
- dashboards that report state instead of synthesizing action
- schedules framed as admin/cron rather than delegated recurring work
- boards organized around runtime/system state rather than project execution
- memory that is absent, hidden, or not reducing repeated explanation
- AI shortcuts layered onto CRUD instead of replacing setup burden
- surfaces that make the user translate intent into objects manually

## Proposed Skill Identity

### Skill Name

- `ai-first-product-ux`

### Suggested Description

```md
Evaluate and redesign existing products for AI-first interaction quality. Use when Codex needs to assess whether a web app or product surface truly turns user intent into outcomes, identify where traditional dashboards/forms/object-management still dominate, apply an AI-first design test, and produce concrete redesign guidance grounded in conversation-first orchestration, project memory, plan-to-execution flows, and review-centered completion.
```

### Suggested UI Metadata

- `display_name`: `AI-First Product UX`
- `short_description`: `Audit and redesign products for true AI-first interaction models`
- `default_prompt`: `Use $ai-first-product-ux to review this app for AI-first interaction quality and produce a north-star-aligned redesign brief.`

## Proposed Skill Workflow

### Step 1: Inspect The Product First

If a running product, screenshots, or code are available:

- inspect the real experience first
- identify the main user loop
- identify where the user is still manually translating intent into setup or objects

Do not start with generic visual critique.

### Step 2: Identify The Dominant Interaction Model

Classify the current product as one of:

- AI-first
- AI-assisted traditional app
- dashboard-first operations tool
- form-first configuration app
- mixed model with competing interaction paradigms

This classification should appear early in the output.

### Step 3: Apply The AI-First Design Test

Review each key surface against these questions:

1. Can the user start by stating intent directly?
2. Does the system ask only for missing information?
3. Is the agent doing setup work instead of the user?
4. Does the surface understand project context automatically?
5. Does the app get simpler as it learns the user?
6. Is the primary view about moving work forward, not managing objects?
7. Are runtime/admin details secondary?
8. Does completion end in a reviewable outcome?
9. If chat disappeared, would the flow collapse into a traditional app?

### Step 4: Diagnose AI-First Gaps

For each major surface, identify:

- what traditional pattern is still dominant
- why that creates friction
- what an AI-first version of the flow should do instead

Priority surfaces by default:

- Home
- Projects
- Chat
- Board
- Review
- Schedules

### Step 5: Recommend Interaction-Level Redesigns

Recommendations should focus on:

- control-plane changes
- flow simplification
- memory/adaptation improvements
- plan/decompose/review loops
- project/workspace/schedule behavior

Avoid defaulting to:

- visual refresh suggestions
- generic “add a chatbot”
- abstract copilot ideas without workflow consequences

### Step 6: Produce An AI-First Redesign Brief

The output should include:

- current-state interaction model diagnosis
- evidence and inferred JTBD
- AI-first failure modes
- redesign principles for this product
- prioritized changes by surface
- what to keep
- what to demote to fallback
- what should become conversational

## Proposed Output Shape

The default deliverable should be a concise redesign brief with:

1. Product classification
2. Core mismatch
3. Findings by severity
4. AI-first redesign directions
5. What to preserve
6. Immediate next moves

If the user asks for more depth, the skill can expand into:

- page-by-page redesign guidance
- north-star alignment review
- implementation-oriented UX spec inputs

## Proposed Bundled Resources

### Keep and Rewrite

- `references/behavior-jtbd.md`
  - keep, still useful
- `references/ai-interaction-patterns.md`
  - rewrite around AI-first product patterns, not just interaction ideas
- `references/design-system-evolution.md`
  - keep, but subordinate to interaction model critique
- `references/deliverable-template.md`
  - rewrite to match the new output shape

### Add

- `references/ai-first-design-test.md`
  - the explicit north-star review questions and anti-patterns
- `references/surface-review-guide.md`
  - what to look for on Home, Projects, Chat, Board, Review, and Schedules
- `references/intent-to-outcome-patterns.md`
  - proposal/confirm flows, current plan, project memory, review-centered completion
- `references/anti-pattern-catalog.md`
  - examples of dashboard drift, form drift, runtime/admin leakage, and fake AI patterns

## Recommended SKILL.md Shape

The new `SKILL.md` should be shorter and sharper than the existing one.

Recommended sections:

- overview
- when to use this skill
- workflow
- AI-first design test
- output expectations
- references

It should not read like a general UX strategy guide.
It should read like a specialized review skill for AI-first product interaction models.

## Migration Guidance

When replacing the old skill:

- preserve any references that still help with JTBD inference and system-aware evolution
- drop generic “research-backed UX upgrade” framing
- rename deliverables from `UX upgrade brief` to `AI-first redesign brief`
- update triggers so the skill fires for:
  - AI-forward app review
  - chat/control-plane critique
  - conversation-first workflow redesign
  - adaptive/project-memory UX review

## Final Recommendation

Delete the old skill after the replacement exists.

Do not treat this as a small edit to `upgrade-ai-ux`.
Treat it as a focused replacement with a different center of gravity:

- old skill: better UX for existing products
- new skill: AI-first interaction model review and redesign
