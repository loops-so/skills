# Loops Agent Skills

Official installable Loops skills for AI coding agents.

This repository packages `SKILL.md`-based skills for working with Loops. It is intended to help agents use the Loops API, official SDKs, the Loops CLI, LMX email markup, and email-sending best practices more accurately.

These skills are designed for agent environments that support installable skills, such as Claude Code, Codex, Cursor, and other tools that work with the `skills` CLI.

## Install

For `skills` CLI setup, agent-specific install targets, and the full list of flags, use the official docs:

- https://skills.sh/docs/cli

This README only documents the Loops-specific install commands.

```bash
# See what this repo contains
npx skills add https://github.com/Loops-so/skills --list

# Install all Loops skills globally (recommended)
npx skills add https://github.com/Loops-so/skills --global

# Install specific Loops skills globally
npx skills add https://github.com/Loops-so/skills --global --skill loops-api
npx skills add https://github.com/Loops-so/skills --global --skill loops-cli
npx skills add https://github.com/Loops-so/skills --global --skill loops-lmx
npx skills add https://github.com/Loops-so/skills --global --skill loops-email-sending-best-practices
```

Project-level installs are also supported. Omit `--global` if you want the skills scoped to the current repository instead of user-level.

### Pin A Release

This repo is versioned with GitHub Releases. For stable installs, pin a release tag instead of installing from the default branch:

```bash
npx skills add https://github.com/Loops-so/skills#v1.0.0 --global
```

### Upgrading From Unprefixed Skill Names

Older installs used the unprefixed skill names `api`, `cli`, `email-sending-best-practices`, and `lmx`. Installing the renamed `loops-*` skills does not automatically remove those old local skills. After installing the prefixed skills, remove the old names:

```bash
npx skills remove api cli email-sending-best-practices lmx --global
```

## Verify Install

After installation, try a task that should trigger one of the skills:

- "Add a contact to Loops from my Next.js backend."
- "Install the Loops CLI and authenticate against the right team."
- "Send a transactional email with the Loops CLI."
- "Write an LMX onboarding email template."
- "Audit this onboarding email flow for deliverability issues."

## What's Included

This repo currently ships:

- four installable skills that auto-load when relevant
- detailed reference files for API, SDK, CLI, LMX, and email-program guidance

This repo does not currently ship:

- slash commands
- MCP servers

## Available Skills

### `loops-api`

Use this skill when you need to:

- create, update, find, or delete contacts
- create and manage custom contact properties
- read mailing lists and update mailing-list membership
- send Loops events from backend code
- send transactional emails with the API or SDKs
- choose between official SDKs and raw HTTP requests
- handle rate limits, idempotency keys, and server-side-only constraints

Example prompts:

- "Add this user to Loops after signup."
- "Check whether this Loops API key is valid."
- "Send this event from my Rails app."

Skill file: [skills/loops-api/SKILL.md](./skills/loops-api/SKILL.md)

### `loops-cli`

Use this skill when you need to:

- install or update the Loops CLI
- authenticate from the terminal and manage stored team keys
- validate credentials with the CLI
- run one-off contact, list, event, or transactional-email commands
- inspect CLI output in text or JSON from the shell

Example prompts:

- "Install the Loops CLI on macOS."
- "Log into the CLI for the staging team."
- "Send a transactional email from the terminal."

Skill file: [skills/loops-cli/SKILL.md](./skills/loops-cli/SKILL.md)

### `loops-email-sending-best-practices`

Use this skill when you need to:

- review inbox-placement or sender-reputation problems
- improve consent flows, list hygiene, or unsubscribe behavior
- improve subject lines, preview text, sender identity, or template design
- decide between lifecycle, campaign, and transactional email
- review a Loops setup for quality or deliverability gaps

Example prompts:

- "Review this welcome email for deliverability risk."
- "Should this message be transactional or marketing?"
- "How should we clean up this stale audience?"

Skill file: [skills/loops-email-sending-best-practices/SKILL.md](./skills/loops-email-sending-best-practices/SKILL.md)

### `loops-lmx`

Use this skill when you need to:

- create or edit Loops email content in LMX
- review LMX markup for valid tags, nesting, attributes, and variables
- use contact properties, components, sections, dynamic links, or dynamic images in Loops email content
- apply Loops email design guidance while producing valid LMX

Example prompts:

- "Write a product update campaign in LMX."
- "Convert this lifecycle email copy into Loops LMX."
- "Review this LMX for Content API compatibility."

Skill file: [skills/loops-lmx/SKILL.md](./skills/loops-lmx/SKILL.md)

## Stability Notes

- This repo is maintained by Loops.
- The Loops CLI has its own skill in this repo.
- The Loops CLI itself is still pre-release and may change faster than the API and SDK docs.
- The LMX skill tracks documented LMX behavior in the Loops editor and Content API.

## Versioning And Releases

Loops skills are versioned as a single repo-level bundle with GitHub Releases and semver-style tags such as `v1.0.0`.

- Major releases include breaking install or behavior changes, such as renamed or removed skills. Release notes must include migration steps.
- Minor releases add skills, broaden documented capabilities, or refresh substantial product behavior.
- Patch releases correct docs, examples, references, or narrow behavior details without changing install names.

Use the GitHub release notes as the changelog for user-facing upgrade guidance.

## Source Of Truth

This repo is the installable Loops entry point for agent skills. When product behavior changes faster than this repo, verify against the official Loops resources:

- Docs: https://loops.so/docs
- API reference: https://loops.so/docs/api-reference/intro
- JavaScript SDK: https://loops.so/docs/sdks/javascript
- OpenAPI spec: https://app.loops.so/openapi.json
- CLI repo: https://github.com/Loops-so/cli

## Contributing

Pull requests are welcome.

When updating a skill:

- keep `SKILL.md` concise and move detailed material into `references/`
- avoid duplicating the same guidance across `SKILL.md` and references
- verify product-specific details against official Loops sources
- re-run `npx skills add . --list` before merging

## Local Validation

```bash
git clone https://github.com/Loops-so/skills.git
cd skills
npx skills add . --list
```

## Repository Structure

```text
skills/
  loops-api/
    SKILL.md
    references/
  loops-cli/
    SKILL.md
    references/
  loops-lmx/
    SKILL.md
    references/
  loops-email-sending-best-practices/
    SKILL.md
    references/
```
