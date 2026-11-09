# Loops CLI Reference

## Contents

- Source URLs
- When To Use The CLI
- Installation
- Auth And Configuration
- Global flags
- Common Workflows
- Practical Guidance

## Source URLs

- https://loops.so/docs/cli
- https://github.com/loops-so/cli
- https://github.com/loops-so/cli/blob/main/README.md

Use `loops agent-context` when you need exact flags or the latest command shape. Current CLI is v0.13.x. If a command is missing locally, check `loops --version` and fall back to `loops agent-context`.

## When To Use The CLI

Prefer the CLI when the user is:

- working from the shell
- doing one-off operational tasks
- validating or rotating credentials
- troubleshooting requests without writing application code
- inspecting output in text or JSON locally

Prefer SDKs or raw HTTP for application code.

## Installation

Prefer the official CLI docs as the source of truth if installation behavior seems to be moving.

### One-line installer (macOS, Linux, Windows via WSL)

```bash
curl -fsSL https://install.loops.so/cli | sh
```

To install a specific version or to a custom path, add `-s -- <version> <path>` after `sh`. The default install path is `~/.local/bin`.

Using a coding agent? Install the Loops CLI and agent skills together with:

```bash
curl -fsSL https://install.loops.so/wizard | sh
```

If the agent cannot run a terminal, connect the [Loops MCP server](https://loops.so/docs/mcp-server) instead.

### Homebrew

```bash
brew install loops-so/tap/loops
```

### Windows PowerShell

```pwsh
irm https://raw.githubusercontent.com/loops-so/cli/main/install.ps1 | iex
```

### Go install

```bash
go install github.com/loops-so/cli/cmd/loops@latest
```

If the user is working from source instead of using an installer, defer to the CLI repo README.

### Verify

```bash
loops --version
```

## Auth And Configuration

The CLI needs a Loops API key. You can either:

- set `LOOPS_API_KEY` in the environment, or
- store named keys with `loops auth ...`

Get the API key from `Settings > API` in Loops.

### Keyring storage

```bash
# Save a key interactively (prompts to paste), verify it, and make it the default
loops auth login my-team

# Save a key without verifying first
loops auth login my-team --skip-verify

# List stored keys
loops auth list

# Interactively pick a stored key and switch to it (requires fzf)
loops auth list --pick

# Set a stored key as the default
loops auth use my-team

# Clear the default stored key
loops auth use --clear

# Show resolved config and which key is active
loops auth status

# Print a stored API key (text prints only the key; json includes name + value)
loops auth get my-team
loops auth get my-team --output json

# Remove a stored key
loops auth logout my-team
```

`loops auth get` prints the API key to stdout. Do not run it in shared terminals or scripts that log output unless the user explicitly needs the secret.

Run `loops auth login <name>` again with a different name to store keys for multiple teams.

Use `--team <name>` on any command to select a specific stored key without changing the default.

### Environment variable

Set `LOOPS_API_KEY` directly when keyring storage is unavailable or when running in CI.

```bash
export LOOPS_API_KEY=your_api_key
```

### Auth precedence

When multiple credentials are available, the CLI resolves them in this order:

1. `LOOPS_API_KEY`
2. `--team <name>`
3. the current default stored key set with `loops auth use`
4. the only stored key, when exactly one exists

Set `NO_COLOR=1` to disable color output.

### Global flags

These apply across the CLI:

- `-o, --output text|json` (`text` is the default)
- `-t, --team <name>` to select a stored team key explicitly
- `--debug` to print API request details before sending
- `-h, --help` to show help for any command

`--pick` on list commands requires `fzf` on `PATH`. It copies the selected ID to the clipboard (or, for `auth list --pick`, switches team). Do not combine `--pick` with `--output json`.

`--web` / `-w` on `campaigns get`, `transactional get`, and `workflows get` opens the resource in the Loops web app instead of printing details. `view` is equivalent. Commands that print those resources also include a `url` field.

## Common Workflows

### Validate credentials

```bash
loops api-key
loops api-key --output json
```

Use this for a quick API-key check against the resolved config.

### Agent discovery

```bash
loops agent-context
loops --version
```

`agent-context` prints JSON describing every command, subcommand, and flag — useful when this reference is behind the installed CLI version.

### Skill install

Install the Loops CLI skill so coding agents can discover and use the CLI:

```bash
loops skill install
loops skill install --all --global -y
```

- `--all` / `-a` — install every Loops skill
- `--global` / `-g` — install globally
- `-y` / `--yes` — skip confirmation prompts

### Contacts

```bash
# Find
loops contacts find --email user@example.com
loops contacts find --user-id usr_123 --output json

# Create
loops contacts create \
  --email user@example.com \
  --first-name Alex \
  --last-name Chen \
  --user-id usr_123 \
  --user-group premium \
  --source signup \
  --list cm_abc123=true \
  --prop planName=Pro \
  --contact-props ./contact-props.json

# Update
loops contacts update \
  --email user@example.com \
  --first-name Alex \
  --source signup \
  --list cm_abc123=false \
  --prop planName=Unlimited \
  --contact-props ./contact-props.json

# Delete
loops contacts delete --email user@example.com

# Suppression
loops contacts suppression check --email user@example.com
loops contacts suppression remove --email user@example.com
```

Useful contact flags:

- `--email` / `-e`
- `--user-id` / `-u`
- `--first-name`, `--last-name`
- `--subscribed` / `-s` `true|false` (omit on create unless you specifically want to unsubscribe or re-subscribe; new contacts are subscribed by default)
- `--user-group`
- `--source` (create and update; replaces the default `"API"`)
- `--list id=true|false` (repeatable)
- `--prop KEY=value` (repeatable)
- `--contact-props path/to/file.json`

Default-property flags such as `--first-name` and `--subscribed` take precedence over `--prop`. Identify a contact with `--email` or `--user-id` on find, update, delete, and suppression commands.

### Contact properties

```bash
loops contact-properties list
loops contact-properties list --custom
loops contact-properties list --pick
loops contact-properties create --name planName --type string
```

Use camelCase for property names. `--type` is one of `string`, `number`, `boolean`, or `date`. Some names are reserved and cannot be used.

### Mailing lists

```bash
loops lists list
loops lists list --pick
loops lists list --output json
```

### Audience segments

Used to target campaigns and to filter inside workflows.

```bash
# List / get
loops audience-segments list
loops audience-segments list --pick
loops audience-segments get <segmentId>

# Create with inline filter
loops audience-segments create \
  --name "Pro plan contacts" \
  --filter '{"match":"all","conditions":[{"type":"property","key":"plan","operator":"equals","value":"pro"}]}'

# Or load the filter from a file
loops audience-segments create \
  --name "Pro plan contacts" \
  --description "Paid plan contacts" \
  --filter-file ./filter.json
```

Useful audience-segment flags:

- `--name` / `-n` (required on create)
- `--description`
- `--filter` (inline JSON) or `--filter-file`
- `--per-page`, `--cursor`, `--pick` (list)

The full audience filter schema lives in the API reference.

### Events

```bash
loops events send signup \
  --email user@example.com \
  --props ./event-props.json \
  --contact-props ./contact-props.json \
  --list list_123=true \
  --idempotency-key signup-user-123
```

Useful event flags:

- `--email` or `--user-id` (one required)
- `--props path/to/file.json`
- `--contact-props path/to/file.json`
- `--list id=true|false`
- `--idempotency-key`

`--props` is a JSON object of event properties, for example `{"plan":"Pro","trialDays":14}`.

### Event patterns

Event names are case-sensitive.

```bash
loops event-patterns list
loops event-patterns list --per-page 20 --cursor abc123
loops event-patterns get --name signup_completed
loops event-patterns get --id <eventPatternId>
```

### Transactional emails

```bash
# List
loops transactional list
loops transactional list --per-page 20 --cursor abc123 --output json
loops transactional list --pick

# Create a transactional email with an empty draft
loops transactional create --name "Password reset"
loops transactional create --name "Password reset" --transactional-group-id <groupId>

# Get, open in the app, metrics
loops transactional get <transactionalId>
loops transactional get <transactionalId> --web
loops transactional view <transactionalId>
loops transactional metrics <transactionalId>

# Ensure a draft, publish
loops transactional draft <transactionalId>
loops transactional publish <transactionalId>

# Update name or group (edit content via email-messages)
loops transactional update <transactionalId> --name "Password reset email"
loops transactional update <transactionalId> --transactional-group-id <groupId>

# Send
loops transactional send <transactionalId> \
  --email user@example.com \
  -v firstName=Alex \
  -v resetLink=https://example.com/reset \
  --idempotency-key reset-user-123

# Send with JSON vars and attachments
loops transactional send <transactionalId> \
  --email user@example.com \
  -j ./vars.json \
  -A ./invoice.pdf \
  -a
```

`loops transactional draft` returns an existing draft unchanged, or creates one seeded from the latest published version when present.

`transactional metrics` returns all-time delivery counters totalled across every published version: `sends`, `deliveries`, `spamReports`, `hardBounces`, `softBounces`. Every command that prints a transactional email includes a `url` field.

Useful transactional flags:

- `--email` (required on send)
- `-a, --add-to-audience`
- `-v, --var KEY=value` (repeatable)
- `-j, --json-vars path/to/file.json`
- `-A, --attachment path/to/file` (repeatable)
- `--idempotency-key`
- `--name` / `-n` (required on create and update)
- `--transactional-group-id` (create/update)
- `--web` / `-w` (`get`; equivalent to `view`)
- `--per-page`, `--cursor`, `--pick` (list)

The CLI also exposes a top-level alias with the same flags as `loops transactional send`:

```bash
loops send <transactionalId> --email user@example.com -v resetLink=https://example.com/reset
```

### Transactional groups

```bash
loops transactional-groups create --name "Account emails"
loops transactional-groups create --name "Account emails" -d "Password resets and login alerts"
loops transactional-groups list
loops transactional-groups list --pick
loops transactional-groups get <groupId>
loops transactional-groups update <groupId> --name "Transactional emails"
```

Useful transactional-group flags:

- `--name` / `-n` (required on create)
- `--description` / `-d`
- `--per-page`, `--cursor`, `--pick` (list)

### Campaigns

Create and edit draft campaigns. A sending domain must be configured before creating campaigns. `campaigns create` also creates an empty email message — use `email-messages update` for subject, sender, preview text, and LMX.

```bash
# List (auto-paginates unless --cursor is set)
loops campaigns list
loops campaigns list --per-page 20 --output json
loops campaigns list --pick

# Create a draft campaign
loops campaigns create --name "Spring product announcement"
loops campaigns create \
  --name "March product update" \
  --audience-segment-id <segmentId> \
  --schedule-at 2026-07-01T12:00:00Z

# Get, open in the app, metrics
loops campaigns get <campaignId>
loops campaigns get <campaignId> --web
loops campaigns view <campaignId>
loops campaigns metrics <campaignId>

# Update a draft campaign
loops campaigns update <campaignId> --name "Renamed announcement"
loops campaigns update <campaignId> \
  --campaign-group-id <groupId> \
  --schedule-now
```

Useful campaign flags (create and update):

- `--name` / `-n` (required on create)
- `--campaign-group-id`
- `--mailing-list-id` (pass `"null"` to clear)
- `--audience-segment-id` (pass `"null"` to clear)
- `--audience-filter` (inline JSON; pass `"null"` to clear) or `--audience-filter-file`
- `--schedule-now` or `--schedule-at <ISO 8601 timestamp>`
- `--web` / `-w` (`get`; equivalent to `view`)
- `--per-page`, `--cursor`, `--pick` (list)

`--audience-filter` and `--audience-filter-file` are mutually exclusive. A filter can be combined with `--audience-segment-id`: contacts must match both. Setting a segment without a filter (or a filter without a segment) clears the other, so pass both together to keep both.

Every command that prints a campaign includes a `url` field. `campaigns metrics` returns all-time engagement counters for a **sent** campaign (`sends`, `opens`, `clicks`, `unsubscribes`, `spamReports`, `hardBounces`, `softBounces`). The API errors if the campaign has not been sent yet. Opens and clicks count sends, not events.

### Campaign groups

```bash
loops campaign-groups create --name "Product updates"
loops campaign-groups create --name "Product updates" -d "Launch and changelog emails"
loops campaign-groups list
loops campaign-groups list --pick
loops campaign-groups get <groupId>
loops campaign-groups update <groupId> --name "Weekly digest"
```

`--name` cannot be the reserved name `"Unsorted"`.

Useful campaign-group flags:

- `--name` / `-n` (required on create)
- `--description` / `-d`
- `--per-page`, `--cursor`, `--pick` (list)

### Email messages

```bash
# Get message fields, LMX, and contentRevisionId
loops email-messages get <emailMessageId>
loops email-messages get <emailMessageId> --output json

# Update draft content (requires a revision flag and at least one content field)
loops email-messages update <emailMessageId> \
  --expected-revision-id rev_123 \
  --subject "Big spring updates" \
  --preview-text "A quick look at what's new" \
  --from-name "Loops" \
  --from-email hello \
  --reply-to support@example.com \
  --lmx-file ./email.lmx

# Or fetch the latest revision automatically (overwrites concurrent edits)
loops email-messages update <emailMessageId> --force --lmx-file ./email.lmx

# Send a test preview (repeatable --email)
loops email-messages preview <emailMessageId> \
  --email user@example.com \
  --email another@example.com \
  --contact-prop firstName=Alex

# Run Guardian content validation
loops email-messages guardian <emailMessageId>
```

The owning campaign must be in `Draft` status for updates.

Preview variable flags depend on the parent type:

- Campaign: `--contact-prop`
- Workflow: `--contact-prop` and `--event-prop`
- Transactional: `--var` / `-v` and `--json-vars` / `-j`

Useful email-message flags:

- `--expected-revision-id` / `-r` — pass `contentRevisionId` from a prior `get` or `campaigns create` (mutually exclusive with `--force`)
- `--force` / `-f` — fetch the current revision and use it
- `--subject`, `--preview-text`, `--from-name`, `--from-email`, `--reply-to`
- `--cc`, `--bcc`, `--language-code`, `--email-format` (`styled` or `plain`)
- `--contact-fallback`, `--event-fallback`, `--data-fallback` (repeatable `KEY=value`; each replaces all server-side fallbacks of that kind)
- `--lmx` or `--lmx-file` (mutually exclusive)
- `preview`: `--email` (repeatable; at least one required), `--contact-prop`, `--event-prop`, `-v`/`--var`, or `-j`/`--json-vars`

`--from-email` is a username only (the part before `@`); the team's sending domain is appended automatically.

At least one of `--subject`, `--preview-text`, `--from-name`, `--from-email`, `--reply-to`, `--lmx`, or `--lmx-file` is required on update.

After a successful update, text output may include LMX `warnings`. JSON output includes them on the response object.

### Themes

```bash
loops themes list
loops themes list --pick
loops themes get <themeId>
loops themes create --name "Newsletter" --styles-file ./styles.json
loops themes update <themeId> --name "Newsletter (dark)" --styles-file ./styles.json
```

`--styles-file` is a JSON object of theme styles, for example:

```json
{
  "backgroundColor": "#ffffff",
  "bodyColor": "#f5f5f5",
  "textBaseColor": "#1a1a1a",
  "textLinkColor": "#2563eb",
  "buttonBodyColor": "#2563eb",
  "buttonTextColor": "#ffffff",
  "borderRadius": 8
}
```

Style changes cascade to every email using the theme. `themes get` prints style fields for reference.

### Components

```bash
loops components list
loops components list --pick
loops components get <componentId>
loops components create --name "Header" --lmx-file ./header.lmx
loops components update <componentId> --name "Header" --lmx-file ./header.lmx
```

`--lmx` and `--lmx-file` are mutually exclusive. Body changes cascade to every email using the component. `components get` prints the component LMX body.

### Uploads

Upload files that can be used in email content.

```bash
loops uploads create ./header.png
```

Use the returned `finalUrl` in LMX `<Image src="..." />` tags.

By default the CLI sniffs the MIME type from the file contents. Override it with `--content-type` if needed:

```bash
loops uploads create ./header.png --content-type image/png
```

### Workflows

Workflow write commands are available; the Workflow API is still evolving and is subject to change. Prefer `--output json` for complex node configuration.

Workflow writes that modify an existing workflow accept `--expected-revision-id` from a prior `workflows get`. If the workflow has changed since then, the request is rejected with a conflict.

```bash
# List / get / open in the app
loops workflows list
loops workflows list --pick
loops workflows get <workflowId>
loops workflows get <workflowId> --web
loops workflows view <workflowId>

# Create / update (defaults to the Unsorted group)
loops workflows create --name "Welcome series" --description "Onboarding emails for new signups"
loops workflows create --name "Welcome series" --workflow-group-id <groupId>
loops workflows update <workflowId> \
  --name "Welcome series v2" \
  --workflow-group-id <groupId> \
  --expected-revision-id <revisionId>

# Delete (re-run with --confirm if the workflow is sending or has queued contacts)
loops workflows delete <workflowId>
loops workflows delete <workflowId> --confirm

# Change mailing list (pass "null" to clear)
loops workflows change-mailing-list <workflowId> \
  --mailing-list-id <listId>
loops workflows change-mailing-list <workflowId> \
  --mailing-list-id <listId> \
  --dry-run \
  --queued-contact-policy fail

# Nodes
loops workflows nodes get <workflowId> <nodeId>
loops workflows nodes metrics <workflowId> <nodeId>
loops workflows nodes create <workflowId> \
  --insert-mode before \
  --node-type SendEmailAction \
  --to-node-id <nodeId>
loops workflows nodes update <workflowId> <nodeId> \
  --payload-file ./node.json \
  --expected-revision-id <revisionId>
loops workflows nodes delete <workflowId> <nodeId> --recursive
loops workflows nodes add-branch <workflowId> <nodeId>
loops workflows nodes reroute <workflowId> <nodeId> \
  --new-target-node-id <targetNodeId>
```

`--insert-mode` is `between` (`--from-node-id` + `--to-node-id`), `before` (`--to-node-id`), or `after` (`--from-node-id`; source must have exactly one outgoing connection).

`--node-type` is one of `AudienceFilter`, `BranchNode`, `ExperimentBranchNode`, `TimerAction`, `SendEmailAction`, or `VariantNode`.

`--payload-file` must include a `typeName` field identifying the node type. `--queued-contact-policy` is `fail` or `discard`. `--dry-run` reports queued-contact impact without applying the change. `--before-node-id` on `nodes create` is deprecated; use `--to-node-id`.

`workflows get` returns metadata (including `url` and `workflowGroupId`) and a node summary table. Use `workflows nodes get` for full node configuration.

`workflows nodes metrics` is only valid for `SendEmailAction` nodes. It returns the same engagement counters as `campaigns metrics`. A node that has not sent yet reports every counter as `0`.

### Workflow groups

Same shape as campaign groups and transactional groups.

```bash
loops workflow-groups create --name "Onboarding"
loops workflow-groups create --name "Onboarding" -d "Top of funnel"
loops workflow-groups list
loops workflow-groups list --pick
loops workflow-groups get <groupId>
loops workflow-groups update <groupId> --name "Activation"
```

Useful workflow-group flags:

- `--name` / `-n` (required on create)
- `--description` / `-d`
- `--per-page`, `--cursor`, `--pick` (list)

### Dedicated sending IPs

```bash
loops dedicated-sending-ips
```

Lists the dedicated sending IP addresses assigned to the team.

### Completion

```bash
# Current session
source <(loops completion bash)
source <(loops completion zsh)
loops completion fish | source

# Persist (macOS Homebrew examples)
loops completion bash > $(brew --prefix)/etc/bash_completion.d/loops
loops completion zsh > $(brew --prefix)/share/zsh/site-functions/_loops
loops completion fish > ~/.config/fish/completions/loops.fish
```

Bash completion requires the `bash-completion` package. PowerShell: `loops completion powershell | Out-String | Invoke-Expression` (add that to the profile for every new session). For zsh, enable `compinit` first if it is not already on.

## Practical Guidance

- Use `--output json` when the CLI output needs to feed another program.
- Use named keys plus `loops auth use` when switching between Loops teams regularly.
- Use `--team` when you want to override the active stored key for a single command.
- Use `--debug` when you need to inspect request behavior from the terminal.
- For campaign or transactional content editing, save `contentRevisionId` from `campaigns create`, `transactional draft`/`get`, or `email-messages get`, then pass it to `email-messages update --expected-revision-id`. Use `--force` only when overwriting concurrent edits is acceptable.
- For workflow edits, save the revision from `workflows get` and pass `--expected-revision-id` on writes.
- Use `view` or `get --web` when the user wants the resource opened in the Loops app. Use `metrics` for all-time engagement/delivery counters.
- Use `--lmx-file` for non-trivial LMX bodies; pair with the `loops-lmx` skill for valid markup.
- If the user needs an exact flag or command not covered here, fall back to `loops agent-context`.
