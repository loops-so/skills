# Loops migration playbook

## Contents

1. [Operating principles](#operating-principles)
2. [Efficient repository discovery](#efficient-repository-discovery)
3. [Inventory and classification](#inventory-and-classification)
4. [Loops capability map](#loops-capability-map)
5. [Migration decisions](#migration-decisions)
6. [Repository implementation](#repository-implementation)
7. [Account provisioning](#account-provisioning)
8. [Report-card contract](#report-card-contract)
9. [Verification](#verification)

## Operating principles

- Preserve behavior before optimizing architecture.
- Audit broadly once, then reuse the inventory. Avoid repeated full-repository scans.
- Prefer the target repository's language, package manager, configuration style, and test conventions.
- Treat provider wrappers, template renderers, and delivery call sites as separate inventory layers.
- Use the current OpenAPI document at `https://app.loops.so/openapi.json` as the API authority.
- Use Loops features when they improve the migrated behavior, not merely because an endpoint exists.
- Never hide unsupported behavior behind a clean-looking report.
- Never print, persist, or commit API keys.

## Efficient repository discovery

### Establish the base

Capture:

- repository root
- repository instructions
- base branch and commit
- current worktree status
- package managers and languages
- relevant workspace/package boundaries
- validation commands

If the worktree is dirty, identify pre-existing files and exclude their unrelated changes from migration counts. Never clean or reset them.

### Scan in batches

If Node.js is available, begin with the bundled scanner:

```bash
node <loops-migrate-skill>/scripts/scan-email-stack.mjs \
  --root <target-repository> > <temporary-scan.json>
```

It scans tracked and unignored files once and emits JSON candidates for packages, provider references, sends, templates, environment variables, behavior signals, and physical line counts for candidate files. Verify its candidates semantically; it intentionally does not decide whether a helper invocation is a real delivery flow or whether an entire candidate file will be deleted.

Treat `candidateFiles` and the reported line numbers as the initial inspection boundary. Do not immediately repeat the scanner with broad repository-wide searches. Start with:

1. Provider dependencies and environment schema
2. Central delivery adapters
3. Reported send-call lines and their imported symbols
4. Referenced templates and shared components
5. Contact, event, webhook, and unsubscribe paths implicated by those flows
6. Relevant tests and deployment documentation

For a candidate over 500 lines, read only a bounded range around each reported line first. Follow exact wrapper, template, and configuration identifiers with targeted `rg -n` searches. Use `--max-columns 300` and exclude lockfiles, source maps, generated output, fixtures, and assets so embedded or minified content cannot flood the result. Open an entire large file only when the bounded reads do not establish behavior.

Expand to a broader search only when a wrapper definition, import, template, configuration value, or required behavior remains unresolved. Adapt the patterns to the detected language and provider. Avoid treating UI text such as “Resend code” as a provider match; require an import, package dependency, environment variable, constructor, endpoint, or delivery method.

When a central adapter exists, read it before its call sites. Its parameter and return contract usually determines the smallest safe migration.

### Reuse external evidence

Fetch the live OpenAPI document once into temporary storage and query that copy for every capability check. Do not refetch it for field-level checks.

Once the scanner identifies the source products, fetch the public Loops price and every required source marketing, transactional, automation, and add-on price concurrently with semantic tracing. Fetch each pricing page once and retain the values, URL, and access date in the private manifest.

Do not reread the skill or repeat completed discovery while assembling the report. Build the proposal from the retained scan, flow map, and pricing evidence.

### Trace behavior, not names

For every distinct send flow, capture:

- call site and business trigger
- recipient source
- transactional, workflow/lifecycle, or campaign intent
- subject, preview, sender, reply-to, CC, and BCC behavior
- template and dynamic variables
- immediate, delayed, or scheduled delivery
- idempotency behavior
- attachments
- failure and retry semantics
- test/development fallback
- unsubscribe or notification-preference behavior

Treat one invocation site as one send call. Treat a shared template used by multiple calls as one template. Treat a business trigger with distinct delivery behavior as one flow.

For an email-only migration, the headline active-flow count must equal the sum of primary transactional, workflow, and campaign destinations. It must not equal the raw send-call or template count unless those happen to represent the same distinct behaviors.

## Inventory and classification

Inventory these categories even when the count is zero:

| Category | Examples |
| --- | --- |
| Providers | SDKs, SMTP transports, raw HTTP clients |
| Send calls | Direct calls and wrapper invocations |
| Templates | React Email, MJML, HTML, text, provider-hosted |
| Shared presentation | Layout, footer, theme, reusable blocks, images |
| Delivery flows | Transactional, scheduled, lifecycle, campaign |
| Contacts | Create, update, user ID, properties, mailing lists |
| Events | Existing product events and event payloads |
| Automation | Schedules, delays, branches, audience filters |
| Compliance | Consent, unsubscribes, suppression, preferences |
| Provider callbacks | Delivery, bounce, complaint, inbound webhooks |
| Configuration | Keys, domains, sender identities, resource IDs |
| Dependencies | Provider SDKs, renderers, SMTP packages |

Classify each item:

- `automatic`: implement it in repository code or through the API using an opinionated default.
- `follow-up`: Loops supports it, but a person must enable a setting, verify a domain, approve content, publish, activate, add credentials, or perform production rollout.
- `unsupported`: Loops has no equivalent capability or required source information is genuinely unavailable.

Do not turn ordinary configuration or approval into a blocker. Unknown target-team access, CC/BCC enablement, a sending-domain check, visual approval, publishing, activation, DNS, secret rollout, and old-provider shutdown are follow-ups. Continue with code changes, draft resources, configuration names, and the provisioning path.

Only use `unsupported` when the migration cannot preserve the behavior with the current Loops product and API. Explain the exact gap and preserve the source path until it is resolved.

## Loops capability map

The following map covers the OpenAPI v1.21.2 surface used when this playbook was authored. Always compare it with the live spec and incorporate new or changed operations.

| Capability | Migration use |
| --- | --- |
| API key | Validate the target team before account writes. |
| Contacts | Create, find, update, delete, check suppression, and remove suppression only when explicitly authorized. |
| Contact properties | Discover and create the properties required by existing user and account data. |
| Mailing lists | Discover list IDs and preserve explicit subscription categories. |
| Dedicated sending IPs | Report current configuration and production prerequisites. |
| Events | Replace application lifecycle triggers and update contact properties or mailing-list membership with the same request. Preserve `Idempotency-Key`. |
| Event patterns | Discover existing event schemas before creating or updating event-triggered workflows. |
| Transactional sends | Replace immediate one-recipient product and account email; support data variables, idempotency, and enabled attachments. |
| Transactional email resources | List, create, get, update, ensure drafts, and publish only with explicit approval. |
| Transactional groups | Recreate source-provider template organization. |
| Campaigns | Create and update campaign drafts for existing broadcast or one-off marketing flows. |
| Campaign groups | Preserve marketing-email organization. |
| Audience segments | Discover and create reusable targeting rules represented in the source system. |
| Email messages | Read and update subject, preview, sender fields, LMX, and fallbacks with revision protection. |
| Email previews | Use only with explicit permission because previews send email. |
| Guardian | Validate every migrated email message; errors prevent verification and warnings appear in follow-up. |
| Themes | List, get, create, and update shared brand styles used by LMX. |
| Components | List, get, create, and update shared headers, footers, and repeated content blocks. |
| Uploads | Upload repository-owned email assets and replace externally hosted static LMX image sources. |
| Workflows | List, create, get, update metadata, and change mailing-list association for lifecycle automation. |
| Workflow nodes | Create email, timer, filter, branch, experiment, and variant nodes; configure supported nodes; add branches; inspect and delete only newly created or explicitly authorized nodes. |

Supported account setup to detect and report as follow-up:

- sending domain required for content-resource creation
- content API access
- workflow API access
- CC/BCC entitlement
- attachment enablement
- translation enablement
- dedicated IP requirements
- sender-domain differences the target team cannot represent directly

Use read endpoints freely. Restrict destructive, sending, publishing, and activation behavior according to the safety rules in `SKILL.md`.

## Migration decisions

### Decision defaults

Make the migration concrete without pausing for choices that can safely be changed later.

#### Sender identity

Default to one Loops team and one verified sending domain. Use one canonical address unless the source has a clear system-versus-human/lifecycle distinction; in that case, use at most two local parts on the same domain:

1. System, security, and product-notification email uses the established system local part, or `no-reply` when none exists.
2. Lifecycle, marketing, or person-led email uses the established human local part, or `hello` when none exists.
3. Vary `fromName` within those categories when useful.
4. Preserve dynamic reply-to behavior separately.
5. Do not create extra sending domains merely to distinguish system, lifecycle, and support email.
6. When source addresses use multiple functional subdomains under one registrable domain, collapse them to the registrable product domain unless the target Loops team already has a verified canonical sending subdomain. Do not select `send.`, `auth.`, a return-path, or a DKIM subdomain merely because it appears in source configuration.

Record the chosen address or two-address split and names in the report. Treat domain verification or a later change of sender as follow-up, not an unresolved migration decision.

#### Mailing-list name

Use an explicit source topic name when one exists. When the source has one generic marketing/unsubscribe category but no durable topic name, use `Product updates & tips`. Do not prefix the product or company name when the Loops team context already supplies it.

#### Email type

- Specific user action, security, receipt, invitation, or product notification: transactional.
- Delayed, scheduled, onboarding, activation, retention, or other lifecycle behavior: event-triggered workflow.
- One-off or broad audience send: campaign.
- Source marketing/unsubscribe category: preserve it with a mailing list and associate the workflow or campaign with that list.

When the source labels a send as marketing, preserve that classification by default. Do not postpone the mapping because the product team may rename or reorganize the list later.

#### Presentation

- Create one shared theme by default.
- Create a second theme only when the source has a material system-versus-marketing visual distinction.
- Create components for genuinely repeated static or namespace-compatible blocks, especially the logo/header and product-specific preference-management content.
- Upload repository-owned static images to Loops instead of relying on source-repository or provider-hosted URLs.

#### Derived and conditional content

LMX does not execute application code. Automatically hoist source template logic into deterministic call-site variables:

- URL formatting becomes values such as `url` and `displayUrl`.
- Optional platform fields become a precomputed `platformDetails` string.
- Optional names become a precomputed `displayName`.
- Date, currency, list, and conditional text formatting remains in application code unless the exact behavior belongs in a workflow property.

Update the call site and LMX together. Conditional JSX, string replacement, and formatting are migration work, not follow-up.

### Immediate product email

Use a transactional email when the source sends one recipient an immediate message caused by an account or product action.

Map:

- source template props to `{data.*}` variables
- provider idempotency to the `Idempotency-Key` header
- dynamic subject, from, reply-to, CC, or BCC to data variables in the email-message fields
- provider attachments to Loops attachments only after attachment access is confirmed
- provider response errors to the existing application error contract

Do not add recipients to the marketing audience unless the source behavior and consent model justify `addToAudience`.

### Delayed, scheduled, or lifecycle email

Prefer an event-triggered workflow when the source provider schedules a send, when application code implements a delay, or when a lifecycle sequence can move out of the request path.

Typical migration:

1. Send an event from the application with stable contact identity and event properties.
2. Create a draft workflow.
3. Change the initial blank trigger to an event trigger.
4. Add and configure a timer when delay is required.
5. Add a `SendEmailAction`.
6. Update its `emailMessageId` with LMX and sending fields.
7. Run Guardian.

Workflow emails use `{contact.*}` and `{event.*}` LMX variables. Register or discover the event pattern before relying on event properties. Set fallback values for optional event properties.

The public API has read endpoints for event patterns but no direct create endpoint. A new real event can establish a pattern, but it also creates or updates a contact and may trigger an existing workflow. Never send a synthetic event only to seed a pattern during an audit or default provisioning run. If the pattern does not exist, leave an explicit rollout step or require a separately authorized `--seed-events` mode that uses a clearly identified non-production contact.

### Campaign or broadcast

Create a campaign draft when the source flow targets an audience rather than a single product action. Preserve:

- mailing list, segment, or filter targeting
- group organization
- sender fields
- subject and preview
- LMX content
- schedule metadata when the API supports the source behavior

Do not schedule or send the campaign without explicit approval.

### Contacts and consent

Map stable application user IDs to `userId` where available. Preserve:

- email and identity changes
- contact properties used for personalization or targeting
- mailing-list membership
- explicit subscribed/unsubscribed state
- notification preferences that are narrower than global email consent

Do not convert a product notification preference into global suppression. Do not re-subscribe suppressed contacts unless explicitly authorized.

### Templates and presentation

Use the `loops-lmx` skill for every conversion.

- Convert shared brand styling into a Loops theme when several emails use it.
- Convert genuinely shared blocks into components.
- Upload static images before using them as LMX `src`.
- Use `{data.*}` for transactional variables, `{event.*}` for workflow event properties, and `{contact.*}` for contact properties.
- Let Loops append its required footer. Preserve custom notification-preference links or other product-specific footer content above it.
- Rebuild custom tables and unsupported layout with valid LMX structures. Hoist conditional rendering and generated text into call-site variables. Keep visual approval as follow-up.
- Run Guardian after the saved LMX compiles.

### Provider callbacks and unsupported behavior

The public OpenAPI does not replace every provider callback or account control. Put DNS, key rollout, and old-account shutdown in follow-up. If application code depends on a provider callback such as delivery status or inbound email and no verified Loops interface replaces it, mark that behavior unsupported and preserve the source path.

## Repository implementation

### Prefer a central adapter

If the source application already uses one provider wrapper:

1. Preserve its public call contract where practical.
2. Replace the provider client inside the wrapper.
3. Introduce explicit Loops resource IDs or event names.
4. Change only the call sites that move to workflows, campaigns, or contacts.
5. Preserve development no-op or log behavior for self-hosted environments.

This approach reduces diff size and keeps error handling consistent. Do not retain a misleading provider-named wrapper after migration.

### Avoid runtime discovery

Do not list resources by name on every request. Provision once and store stable IDs using the repository's existing environment or configuration system.

Use clear configuration names, for example:

```text
LOOPS_API_KEY
LOOPS_TRANSACTIONAL_OTP_ID
LOOPS_TRANSACTIONAL_ORGANIZATION_INVITE_ID
LOOPS_WORKFLOW_FIRST_PROJECT_ID
```

Use the target repository's naming conventions. Never commit real values.

### Preserve source behavior

Verify these explicitly:

- missing-key behavior in development and production
- provider response shapes relied on by callers
- retry and idempotency behavior
- parallel send and partial-failure behavior
- rate limits
- custom sender domains
- reply-to, CC, and BCC
- delayed delivery
- attachments
- notification settings and unsubscribe behavior

## Account provisioning

Generate a repository-native provisioning script when the migration creates multiple account resources, the project is self-hosted, or different deployments need their own Loops team.

Prefer one generic script generated for the target repository over a provider- or customer-specific script bundled with this skill.

The script should:

1. Default to a read-only `--dry-run`; require `--apply` for writes.
2. Validate the team with `GET /v1/api-key` and print only non-secret identity.
3. List existing resources and match only stable names owned by the migration.
4. Create or reuse groups, themes, components, audience segments, transactional emails, campaigns, and workflows.
5. Use returned revision IDs for every email-message and workflow mutation.
6. Upload required assets and persist returned URLs in generated LMX.
7. Run Guardian after each email-message update.
8. Never publish, activate, send events, send previews, send email, delete, or rotate credentials.
9. Print the environment-variable names and created IDs for the operator to store.
10. Be idempotent: a second run should report no duplicate resources and perform no unnecessary writes.

Keep generated LMX or provisioning manifests only when they are useful source artifacts for self-hosting or future updates. Otherwise avoid adding migration scratch files.

## Proposal and final report-card contract

Use the same compact schema at two stages:

- `proposal` before mutations, using mapped resources, measured source code, selected defaults, estimated savings, and the work boundary
- `final` after verification, using created resources, the actual diff, verified savings, and remaining human follow-up

Do not calculate or display a projected grade.

Both outputs are one-screen implementation summaries: roughly 10–20 lines and no more than 250 words. Keep the complete resource map, file inventory, variable map, behavior notes, per-file measurements, and pricing evidence in the structured baseline manifest. Show that detail only when the user asks for it.

The proposal contains:

- project, audit commit, and active-flow count
- `Move to Loops`: compact counts for the relevant destination resources
- `Clean up`: send calls, adapters, estimated or verified source lines, dead code, and package impact
- `Cost`: complete source-stack spend, including separate marketing and transactional plans when used; public Loops list price; monthly, annual, and percentage difference; and a confidence label that distinguishes verified or usage-backed expectations from an illustrative scenario
- `Defaults`: sender, mailing-list, and presentation decisions in one or two lines
- `If approved`: two plain-language sentences covering what the migration will change and what remains out of scope
- one direct migration CTA
- `Unsupported`: only when a genuine product or API gap exists

Omit empty categories unless the zero is decision-useful. Do not list every email, event property, send variable, package name, file, or per-file line count in the default report.

Count only top-level Loops resources in the headline. A timer, filter, branch, experiment, variant, or workflow email is a node inside a workflow, not a standalone migration resource. Keep node counts and delay behavior in the internal manifest or workflow drill-down.

Use proposal tense consistently: `to create`, `to replace`, `to remove`, and `to add`. Never describe proposed work as already created, replaced, removed, or added.

Count unique dependency package names in the headline. Keep per-workspace dependency declarations in the private manifest so duplicate declarations do not inflate the user-facing package count.

Write `If approved` as prose, never as a list, grid, or `To do` / `To preserve` / `Excluded` taxonomy. The first sentence states the implementation scope: create an isolated migration branch, update the application to use Loops, and either create the required draft resources or, for self-hosted projects, add a setup script so each deployment can create its own draft resources. The second sentence states that publishing, activation, live sends, DNS changes, and current-provider shutdown remain out of scope. Keep behavior-preservation details in the internal manifest or drill-down unless the user asks for them.

### Internal supporting detail

The retained migration manifest must still map every active source flow to exactly one primary Loops destination and record:

- campaigns; transactional emails and groups; workflows, emails, timers, filters, and branches
- events and event properties; contacts and properties; mailing lists and audience segments
- themes, components, and uploaded assets
- sending call sites, provider adapters, source files, dead files, dependencies, environment variables, and documentation
- pricing date and source, actual or estimated volume, selected scenario band, marketing-contact count, transactional volume, marketing volume, automation runs, product-level source costs, source total, public Loops tier, and calculation confidence
- sender choices, topic mappings, presentation structure, derived variables, idempotency, self-hosted behavior, and every necessary human follow-up

Use physical source lines for the baseline estimate. Include every full source file planned for deletion plus provider-only constants or exports that become unused. Count dead code across templates and those provider-only symbols, not only dead template files. Record the sorted included-file and symbol list in the private manifest so repeated audits produce the same sum. Label the number `estimated removal`; do not predict the final net diff. The final report uses Git diff statistics and reports:

- lines added and deleted
- files added, changed, and deleted
- verified dead-code removal
- package declarations removed and added
- residual provider imports, calls, variables, templates, and documentation

Keep gross removal and net diff distinct. Generated lockfile churn is reported separately when material.

Supported dashboard settings, approvals, publishing, activation, credentials, DNS, cutover, and old-provider retirement belong under `Later`; they are not blockers. Record `Unsupported` only for behavior with no viable Loops equivalent.

Use only the public Loops list price in the report and savings calculation. Never disclose, label, imply, or apply a discount, credit, comp, negotiated rate, or other commercial arrangement.

Keep the report provider-neutral. Do not name or link to the source company, provider, product, plan, or pricing page in the headline, cost comparison, cleanup summary, or follow-up. Use `Current stack`, `provider adapter`, and `current provider`. Provider names and source URLs may remain only in private audit evidence and implementation details when technically necessary.

Keep API and schema versions in the private manifest. Do not display them in the proposal or final report.

Assemble the proposal once from the retained manifest. Validate only these presentation invariants before returning it: 10–20 lines and at most 250 words; active flows reconcile to primary destinations; no workflow node is counted as a top-level resource; pricing wording matches its confidence; source names and private commercial terms are absent; and the CTA is exact. Do not reopen the repository or redo pricing during report validation.

### Presentation

First assemble and validate the canonical report from the retained manifest. Presentation must not change its facts, calculations, approval boundary, or completion status.

When running in Codex and the `visualize` skill is available, load and follow that skill to present the proposal or final report as a compact inline visualization.

When running in Claude, keep the report inline and choose the available native surface:

- In Claude web, desktop, or Cowork when custom visuals are available, present the canonical report as one compact inline report-card visual.
- In Claude Code, present the canonical report as a compact Markdown dashboard using the template below. Do not require or change the user's global output style.

Do not generate an HTML report, open a separate browser view, or add a visualization artifact to the target repository. Use Mermaid only when the user separately asks for a process diagram; exact report-card values belong in the Markdown tables.

For the proposal, show:

- audit revision and proposal status
- up to three headline metrics
- migration-resource composition
- cleanup counts and estimated code removal
- cost comparison, assumptions, and confidence wording
- selected defaults and implementation boundary

Place the exact migration CTA in Markdown immediately after the visualization:

`Say migrate to move forward with the migration. No existing sending will be impacted until you merge the PR.`

Do not show migration activity or a completed status in the proposal.

For the final report, use the same structure with verified values. Show `Migration complete` only after every completion requirement passes. Replace the proposal CTA with no more than three grouped remaining actions.

When inline visualization is unavailable, use the text proposal or final-report template below. Keep both presentations to one screen and at most 250 words.

#### Claude Code Markdown dashboard

Use this layout for a proposal, replacing every example value from the retained manifest:

```markdown
### Project · Loops migration proposal
`Proposal` · audited `<commit>` · **8 email flows**

| Move to Loops | Clean up | Estimated removal |
| --- | --- | --- |
| **6** transactionals<br>**2** workflows<br>**0** campaigns | **10** send calls<br>**1** adapter<br>**6** packages | **~767** source lines<br>**71** dead-code lines |

| Shared resources | Defaults |
| --- | --- |
| 1 mailing list · 1 theme · 3 components · 1 asset | example.com · no-reply for system · alex for lifecycle |

**Illustrative estimate** · assumes 10k marketing contacts + 100k transactionals/mo

Current stack ≈$<total>/mo · Loops $<loops>/mo · potential savings ≈$<monthly>/mo / $<annual>/year (≈<percent>%). Actuals vary by usage and plan.

**If approved.** Create an isolated migration branch, update the application to use Loops, and create the required draft Loops resources. Publishing, activation, live sends, DNS changes, and current-provider shutdown remain out of scope.
```

For a final report, change the status to `Migration complete`, replace proposed and estimated values with verified results, and replace `If approved` with no more than three grouped `Remaining` actions. Keep the exact proposal CTA outside the dashboard so it remains selectable and unambiguous.

### Proposal template

```text
Project · Loops migration proposal
Audited <commit> · 8 email flows

Move: 6 transactionals to create · 2 workflows to create · 0 campaigns
Shared: create 1 mailing list · 1 theme · 3 components · 1 asset
Cleanup: 10 send calls to replace · 1 adapter and 6 packages to remove
Code: ~767 source lines to remove · 71 dead-code lines

Illustrative estimate · assumes 10k marketing contacts + 100k transactionals/mo
Current stack ≈$<total>/mo · Loops $<loops>/mo
Potential savings ≈$<monthly>/mo · $<annual>/year (≈<percent>%); actuals vary by usage and plan.

Defaults: example.com · no-reply for system · alex for lifecycle
Marketing: Product updates mailing list

If approved: Create an isolated migration branch, update the application to
use Loops, and create the required draft Loops resources. Publishing,
activation, live sends, DNS changes, and current-provider shutdown remain
out of scope.

Say migrate to move forward with the migration. No existing sending
will be impacted until you merge the PR.
```

Stop after the proposal. Do not begin migration work until the user explicitly approves it.

### Final report

Use the same compact resource, cleanup, cost, and defaults sections. Change the title to `Project · Loops migration complete`, replace every estimate with verified results, and finish with no more than three grouped `Remaining` actions for account settings, approval, publishing, activation, rollout, or provider shutdown. Do not ask for migration approval again. Add a short `Unsupported` section only when nonempty.

Do not claim generic benefits such as analytics or workflows unless the migration actually creates the necessary event, contact, or email structure.

## Verification

### Repository

- Run formatter, lint, typecheck, build, and tests at the scope required by the touched code.
- Re-run exact provider import, constructor, endpoint, environment-variable, and send-method searches.
- Confirm package manifests and lockfiles no longer retain removable provider or renderer packages.
- Confirm no generated or user-owned files were overwritten.
- Confirm no secret value appears in the diff.

### Behavior

- Compare every baseline send flow with a final destination.
- Verify dynamic variables, subjects, sender fields, reply-to, CC/BCC, idempotency, scheduling, attachments, and error handling.
- Verify development and self-hosted behavior without a Loops key.
- Verify notification preferences and consent behavior independently from global suppression.

### Loops resources

- Confirm the target team.
- Confirm created resources are drafts and names/IDs are recorded.
- Confirm LMX updates succeeded with current revision IDs.
- Run Guardian and record errors and warnings per email message.
- Confirm provisioning is idempotent when a setup script is generated.
- Do not use a sent preview as a validation step unless the user explicitly authorizes the recipient and send.

### Completion

The migration is not complete if:

- any discovered send flow lacks a destination
- a template or resource ID is invented
- Guardian has errors
- required repository checks fail
- provider code is claimed removed but remains reachable
- account work is claimed complete without verified account state
- the final report omits known follow-up or unsupported behavior
