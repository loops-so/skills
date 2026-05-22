---
name: loops-lmx
description: >
  Use this skill whenever the user wants to create, write, generate, or edit
  email content in Loops. This includes composing campaigns, loops, lifecycle
  emails, or email-message bodies for the Loops editor. LMX
  (Loops Markup Language) is the format used for Loops email content. Trigger
  on phrases like "create a campaign", "generate an
  email", "write a welcome email", "draft a lifecycle email", "build an email
  template", "create an onboarding email", "LMX", "Loops email", or any
  request to produce or modify email body content intended for Loops. Do not
  trigger for questions about the Loops HTTP API, SDK integration, or CLI unless
  email body content is also involved.
metadata:
  version: 1.1.3
---

# LMX Skill

This skill helps write, review, and generate correct LMX email markup for Loops. LMX is an XML-based format: every element is a PascalCase tag, self-closing tags require `/>`, and only the tags in the spec are valid.

## When To Use

Use this skill when the task involves:

- generating or editing LMX email content
- reviewing LMX markup for correctness
- choosing the right LMX tags or attributes for a layout
- applying design guidelines to an LMX document
- explaining how a specific LMX tag or attribute works

## Working Style

When this skill is active:

1. Read `references/lmx-spec.md` for the full tag and attribute reference. It is authoritative — do not invent tags or attributes.
2. Read `references/lmx-design-guidelines.md` for Loops design guidelines. Apply these to every document you generate unless the user explicitly overrides a rule.
3. Validate nesting and content-type rules before producing output (see spec section 3).
4. Check the common-mistakes table in the spec before finalizing output.
5. Always produce a complete, valid document — not fragments, unless the user specifically asks for one.

## Category Routing

- Tag definitions, required/optional attributes, nesting rules, content types, variable syntax, self-closing requirements, or escaping:
  Read `references/lmx-spec.md`

- Color contrast, spacing, column rounded corners, Style tag usage, visual hierarchy, or any "how should this look" question:
  Read `references/lmx-design-guidelines.md`

- Creating campaigns, posting LMX via the API, revision IDs, themes, components, or image uploads:
  Use the `loops-api` skill (HTTP) or `loops-cli` skill (terminal). This skill covers the LMX document itself.

## Output Checklist

Before returning any LMX output, verify:

- [ ] All tags are PascalCase and in the allowed set
- [ ] All self-closing tags use `/>` (e.g. `<Image />`, `<Divider />`, `<Br />`, `<Icon />`, `<Style />`)
- [ ] XML-sensitive characters are escaped: `&` as `&amp;`, `<` as `&lt;`, and `"` in attributes as `&quot;`
- [ ] Required attrs are present: `src` on `<Image />`, `componentId` on `<Component>`, `name` on `<Icon />`, and `href` on `<Link>`
- [ ] No text or inline tags at the top level
- [ ] Variables use explicit LMX namespaces and only appear where supported: inline content, button text, `<Button href>`, `<Link href>`, `<Image alt/href/dynamicSrc>`, and `<Section href>`
- [ ] No inline fallback syntax is invented; fallbacks live outside the LMX string
- [ ] `<Button>` text has no inline tags, but can contain variables; include `href` for clickable CTA buttons
- [ ] `<CodeBlock>` treats braces literally
- [ ] `<Style />` appears at most once as a top-level tag; put it first in generated output
- [ ] Body/background colors are intentional: supplied by `themeId` or explicit `bodyColor`/`backgroundColor`
- [ ] No same-color-on-same-color situations (check text vs block color, icon color vs background, etc.)
- [ ] Sufficient Y-spacing on block elements
- [ ] `<Columns>` has exactly two `<ColumnItem>` children
- [ ] Dynamic images use static `src` plus `dynamicSrc`, not variables in `src`
- [ ] `<Icons color>` uses one of `#000000`, `#808080`, or `#ffffff`; `<Icon>` has no `color` attr
- [ ] No legal footer, postal address, or unsubscribe block is added by hand; Loops adds required footer content automatically. A branded footer component can appear above it
