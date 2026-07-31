---
name: loops-migrate
description: >
  Audit, plan, execute, and verify repository migrations from an existing email
  provider, SMTP delivery stack, code-based template renderer, hosted marketing
  platform, or lifecycle automation tool to Loops. Use when the user asks to
  migrate or move a codebase to Loops, replace an email provider with Loops,
  assess migration readiness, produce a Loops migration report card, convert a
  repository's existing templates to LMX as part of a migration, or move
  existing sends, contacts, events, campaigns, and lifecycle automation into
  Loops. Produce a read-only baseline proposal before changing anything, ask
  for explicit approval to perform the migration, execute approved work on an
  isolated branch, and finish with a verified report card and production
  follow-ups. Do not use for a single net-new Loops API call or a standalone
  new or converted email; use the Loops API or LMX skill instead.
metadata:
  version: 0.6.1
---

# Loops Migration

Migrate the complete email surface, not only the provider import. Preserve behavior, choose sensible Loops-native defaults, and separate migration work from later account or production follow-up.

## Load the migration playbook

For the read-only proposal, load only these sections of `references/migration-playbook.md`: `Operating principles`, `Efficient repository discovery`, `Inventory and classification`, `Loops capability map`, `Migration decisions`, and `Proposal and final report-card contract`. Read `references/pricing-and-savings.md` before calculating migration cost or expected savings. After migration approval, load the remaining `Repository implementation`, `Account provisioning`, and `Verification` sections before changing anything.

After migration approval, also use these installed skills when available:

- `loops-api` for current API and SDK behavior
- `loops-lmx` for every LMX conversion or review
- `loops-cli` for terminal authentication and supported commands
- `loops-email-sending-best-practices` for consent, unsubscribe, deliverability, and domain follow-ups

Treat `https://app.loops.so/openapi.json` as the API source of truth. Fetch it once per run into temporary storage, record its `info.version` in the private baseline manifest, and reuse that copy for every relevant capability check. Do not download it again for individual fields or endpoints. If installed guidance conflicts with the live spec, follow the live spec and report the discrepancy.

## Choose the run mode

- Every new migration starts with a read-only proposal. Do not change repository files or Loops account state in the same turn as the proposal.
- For an audit, assessment, plan, or report-card request, stop after the proposal.
- For a migrate, move, replace, or implement request, still stop after the proposal and ask whether to do the work. The initial migration request does not bypass this approval gate.
- Continue to implementation only after the user replies to the proposal with `migrate` or another unmistakable approval in a later turn.
- If credentials or account-level prerequisites are unavailable, complete the repository work and generate a repository-native provisioning path. Put supported dashboard settings, approvals, and rollout steps in `follow-up`; reserve `unsupported` for a real product or API gap.

## Phase 1: Audit and propose without mutations

1. Read the target repository instructions and inspect Git status, the current branch, and the base revision.
2. If Node.js is available, resolve `scripts/scan-email-stack.mjs` relative to this `SKILL.md`, run it once with `--root <target-repository>`, and retain its JSON in temporary storage. Treat its candidate files and line numbers as the initial discovery boundary, not as final semantic classification.
3. Inspect the central adapter first, then use targeted, line-bounded reads around scanner candidates and follow imported symbols to call sites or templates. Do not repeat the scanner's broad repository searches or open whole large/generated files. Expand outside the candidate boundary only when a traced import, wrapper, configuration symbol, or unresolved behavior requires it.
4. Inventory provider packages, direct sends, templates, shared layout, contacts, events, webhooks, suppression behavior, sender domains, environment variables, tests, removable dependencies, current email-platform spend, subscribed marketing contacts, transactional volume, marketing volume, automation runs, and paid add-ons. Trace each real send through its wrapper and call site, preserving scheduling, idempotency, attachments, headers, test behavior, error handling, opt-outs, and self-hosted fallbacks.
5. Classify every migration item as `automatic`, `follow-up`, or `unsupported`. Apply defaults instead of requesting decisions when the source behavior and Loops model provide a safe answer.
6. Select the Loops destination for every flow: transactional email, workflow, campaign draft, contact synchronization, event, mailing list, audience segment, theme, component, or upload.
7. As soon as the scanner identifies the source products, fetch the Loops and required source pricing pages concurrently with semantic tracing. Fetch each page once. Measure candidate code, dead-code, dependency, environment, and provider-specific documentation removal; then calculate the recurring cost difference across every required source product category. Use verified spend or usage when available; otherwise use the standardized estimated-volume bands in the pricing reference and label the result as illustrative potential savings, not an expected outcome.
8. Produce the migration proposal directly from the retained manifest without re-running discovery. Organize it around proposed Loops resources, estimated code impact, expected cost reduction, chosen defaults, and the execution boundary, without a projected grade or source-company names. Keep it to one screen, roughly 10–20 lines and no more than 250 words; retain the detailed inventory and pricing evidence for drill-down only when requested.
9. End with this exact CTA: `Say migrate to move forward with the migration. No existing sending will be impacted until you merge the PR.` Stop and wait for the answer.

Keep a structured baseline manifest in temporary agent storage and reuse it through the final report. Do not add audit scratch files to the target repository unless the user asks for them.

## Phase 2: Migrate safely

Begin this phase only after explicit approval of the proposal.

1. Work from the audited revision on a dedicated migration branch using the target repository's branch convention. Never discard or overwrite pre-existing user changes.
2. Validate the intended Loops team with `GET /v1/api-key` before creating account resources.
3. Prefer a central adapter migration when the source repository already centralizes email delivery. Change call sites when Loops needs explicit transactional IDs, events, precomputed variables, mailing-list membership, or workflow triggers.
4. Apply the decision defaults in the playbook: one sending domain with one or two category senders, application-side derived variables, one shared theme by default, shared components, and mailing lists for source unsubscribe topics.
5. Convert templates to valid LMX; create or reuse themes, components, and groups; reuse existing mailing lists or name the required dashboard-created list in follow-up; and keep new transactional emails, campaigns, and workflows in draft state.
6. Keep application requests server-side, preserve idempotency and error contracts, and avoid runtime resource-name lookups. Store stable created IDs in the target repository's existing configuration pattern.
7. For repositories distributed to multiple operators or intended for self-hosting, generate an idempotent repository-native provisioning script rather than hardcoding one team's resource IDs.
8. Remove source-provider code, packages, variables, and dead templates only after their replacements are verified.

Creating isolated draft resources is in scope for an authorized full migration after the target team is verified. Do not publish templates, activate workflows, send previews or live email, rotate production secrets, change DNS, delete live provider resources, or cancel the old provider without explicit user authorization.

## Phase 3: Verify and hand off

1. Run the narrowest relevant repository checks, then broader checks when shared code or configuration changed.
2. Re-run the inventory searches and account-resource checks against the baseline.
3. Validate every LMX write, run Guardian for every created or updated email message, and do not verify a migration while Guardian errors remain.
4. Verify dependency and lockfile cleanup, environment documentation, sender behavior, self-hosted behavior, and the absence of secrets.
5. Produce the final report card using the proposal schema. Replace proposed and estimated figures with verified resource, diff, line-removal, dependency-removal, residual-search, and pricing results. Keep the final report to the same one-screen format and offer supporting detail only when requested.
6. Leave a concise follow-up list for DNS, key rollout, approval, publishing, workflow activation, data import, or old-provider shutdown.

Do not call the migration complete while a send surface is missing from the final inventory, behavior parity is unverified, or a claimed result is based only on intent.
