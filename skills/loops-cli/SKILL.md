---
name: loops-cli
description: >
  Use this skill whenever the user wants to work with the Loops CLI from the
  terminal. This includes installing or updating the CLI, authenticating,
  storing and selecting API keys, validating credentials, and running commands
  for contacts, contact properties, lists, events, and transactional email.
  Trigger on phrases like "Loops CLI", "loops auth login", "loops contacts
  create", "loops contacts update", "loops events send", "loops transactional
  send", "loops api-key", "brew install loops-so/tap/loops", or any time the
  user wants to use Loops from the shell instead of application code.
metadata:
  version: 1.0.0
---

# Loops CLI Skill

This skill helps with Loops terminal workflows. Use it for installation, auth and configuration, command selection, and shell-first operational tasks.

## When To Use

Use this skill when the user needs to:

- install, update, or troubleshoot the Loops CLI
- authenticate with Loops from the terminal
- manage stored team keys or switch between them
- run one-off contact, list, event, or transactional-email commands
- inspect CLI output in text or JSON locally

This skill is for command-line usage, not application integrations or email-strategy review.

## Working Style

When this skill is active:

1. Prefer `loops agent-context` for exact flags and the latest command shape.
2. Prefer the CLI for shell workflows, one-off operational tasks, credential validation, and quick troubleshooting.
3. Use `--output json` when the result needs to feed another tool or script.
4. Use named stored keys plus `--team` when the user works across multiple Loops teams.
5. Avoid printing secrets. Prefer keyring-backed auth or environment variables over hardcoded API keys.
6. If the task becomes application-code integration or exact HTTP payload design, use the separate `loops-api` skill.

Official references:

- CLI repo: `https://github.com/loops-so/cli`
- CLI README: `https://github.com/loops-so/cli/blob/main/README.md`

## Category Routing

- Installation, auth flows, config resolution, global flags, and common Loops CLI workflows:
  Read `references/cli.md`

## Output Checklist

Aim to leave the user with:

- the right command or install path for the task
- any auth or team-selection caveats that affect behavior
- safe handling of credentials
- the next validation step, such as `loops --help`, `loops auth status`, or `loops api-key`
