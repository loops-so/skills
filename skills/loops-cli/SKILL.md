---
name: loops-cli
description: >
  Use this skill whenever the user wants to work with the Loops CLI from the
  terminal. This includes installing the CLI, authenticating, managing API keys,
  and running commands for contacts, lists, events, transactional email,
  campaigns, email messages, themes, components, uploads, workflows, groups,
  metrics, and skill install. Trigger on phrases like "Loops CLI",
  "loops auth login", "loops campaigns create", "loops campaigns view",
  "loops campaigns metrics", "loops email-messages update", "loops workflows list",
  "loops workflow-groups create", "loops transactional send", "loops skill install",
  "loops agent-context", "brew install loops-so/tap/loops", or any time the user
  wants to use Loops from the shell instead of application code.
metadata:
  version: 1.2.0
---

# Loops CLI Skill

This skill helps with Loops terminal workflows. Use it for installation, auth and configuration, command selection, and shell-first operational tasks.

## When To Use

Use this skill when the user needs to:

- install, update, or troubleshoot the Loops CLI
- authenticate with Loops from the terminal
- manage stored team keys or switch between them
- run one-off contact, list, event, or transactional-email commands
- create and publish transactional emails, including drafts and groups
- create draft campaigns, update email-message content, run Guardian checks, and upload images from the shell
- list, create, and update themes and reusable components for LMX
- list, create, edit, and delete workflows and workflow nodes
- manage audience segments, campaign groups, transactional groups, and workflow groups
- open campaigns, transactional emails, or workflows in the Loops web app
- fetch all-time campaign, transactional, or workflow-node metrics
- inspect CLI output in text or JSON locally

This skill is for command-line usage, not application integrations or email-strategy review.

## Working Style

When this skill is active:

1. Prefer `loops agent-context` for exact flags and the latest command shape.
2. Prefer the CLI for shell workflows, one-off operational tasks, credential validation, and quick troubleshooting.
3. Use `--output json` when the result needs to feed another tool or script.
4. Use named stored keys plus `--team` when the user works across multiple Loops teams.
5. Avoid printing secrets. Prefer keyring-backed auth or environment variables over hardcoded API keys. Do not run `loops auth get` unless the user explicitly needs the raw key.
6. If the task becomes application-code integration or exact HTTP payload design, use the separate `loops-api` skill.

Official references:

- CLI docs: `https://loops.so/docs/cli`
- CLI repo: `https://github.com/loops-so/cli`
- CLI README: `https://github.com/loops-so/cli/blob/main/README.md`

## Category Routing

- Installation, auth flows, config resolution, global flags, completion, skill install, and common Loops CLI workflows:
  Read `references/cli.md`
- Campaigns, campaign groups, audience segments, email messages, themes, components, revision handling, LMX file flags, uploads, transactional lifecycle, workflows, workflow groups, view/web, and metrics:
  Read `references/cli.md`. For LMX markup itself, also use the `loops-lmx` skill.

If the task becomes application-code integration or exact HTTP payload design beyond the CLI, use the `loops-api` skill.

## Output Checklist

Aim to leave the user with:

- the right command or install path for the task
- any auth or team-selection caveats that affect behavior
- safe handling of credentials
- the next validation step, such as `loops --help`, `loops auth status`, `loops api-key`, or `loops agent-context`
