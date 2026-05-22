# LMX Design Guidelines

These guidelines apply to every LMX document unless the user explicitly overrides a rule. They cover visual design decisions that the spec does not enforce but that produce good-looking, readable emails.

---

## Set Body And Background Color

Every document should have intentional body and background colors, either from a referenced theme or from explicit `<Style />` overrides.

- `bodyColor`: the email body/card background (the centered content area)
- `backgroundColor`: the page/canvas behind the body

If `<Style />` has a `themeId` and that theme already defines suitable body and background colors, do not duplicate those attributes unless you are intentionally overriding the theme. If no theme is used, or the theme colors are unknown, set both `bodyColor` and `backgroundColor` explicitly.

Setting both colors, either via theme or overrides, gives the email a clear visual structure and prevents the renderer from falling back to defaults that may clash with your content.

If `bodyColor` is not set, the email body does not get a separate card/background color, so the `backgroundColor` shows through behind the content. That can be useful for plain/full-width designs, but for card-like styled emails set both values intentionally.

```xml
<!-- Good: standalone colors -->
<Style bodyColor="#ffffff" backgroundColor="#f1f5f9" bodyYPadding="24" />

<!-- Good: theme provides colors; only override what needs changing -->
<Style themeId="st_123" bodyYPadding="24" />

<!-- Not this: missing backgroundColor without a theme known to provide it -->
<Style bodyColor="#ffffff" />
```

If the user asks for a dark email:

```xml
<Style bodyColor="#0f172a" backgroundColor="#020617" bodyYPadding="24" />
```

Always infer sensible defaults for `bodyYPadding` (typically `"16"` to `"32"`) even when the user doesn't specify.

---

## Contrast: No Same-Color-On-Same-Color

Never place text, icons, or UI elements in the same color (or near-same color) as their background. Common failure modes to check:

**Text vs block/body background:**
- If `bodyColor` is white (`#ffffff`), `textBaseColor` must be dark (e.g. `#0f172a`, `#1e293b`).
- If you set `blockColor` on a `<Paragraph>` or heading, the text inside must have sufficient contrast against that `blockColor`, not just the body.
- Never use `textColor="#ffffff"` on a block with `blockColor="#ffffff"` or a light `bodyColor`.

**Buttons:**
- `bgColor` and `textColor` on `<Button>` must contrast. Dark backgrounds need light text. Light backgrounds need dark text.
- If no explicit `textColor` is set on a `<Button>`, assume the document's `textBaseColor` will be used; ensure that still contrasts against the button `bgColor`.

**CodeBlock:**
- `<CodeBlock>` has its own `blockColor`. If you set a custom `blockColor` on a `<CodeBlock>`, also ensure the surrounding `bodyColor` and the code text color are visually distinct from that block. A good default is a slightly darker or muted tint of the body color (e.g. `#f1f5f9` on a white body).
- If you change `<CodeBlock blockColor="...">` to a dark color, you must also visually account for the code text; note that there is no explicit text color attribute on `<CodeBlock>`, so use `blockColor` values that contrast with the inherited text color.

**Icons:**
- `<Icons color="...">` sets the icon color. If the `<Icons>` block sits on a `bodyColor` background, the icon color must contrast against the body. White icons on a white body are invisible.
- If you set `blockColor` on the `<Icons>` element, icon color must contrast against that, not the body.

---

## Add Vertical Spacing Around Elements

Use `paddingTop` and `paddingBottom` on block elements to add breathing room. Emails without spacing feel dense and hard to scan.

Default approach:
- Headings (`<H1>`, `<H2>`, `<H3>`): add `paddingTop="24"` or `paddingTop="32"` unless they are the first element.
- `<Paragraph>` after a heading: `paddingBottom="8"` to `"16"` is typical.
- `<Button>`: add `paddingTop="24"` and `paddingBottom="24"` to give CTAs room.
- `<Divider>`: typically fine without explicit padding, but add `paddingTop="16" paddingBottom="16"` if elements feel crowded.
- `<Image />`: `paddingBottom="16"` unless immediately followed by a caption paragraph.

Use `bodyYPadding` on `<Style />` for global top/bottom padding inside the body. `"16"` to `"32"` is a sensible default.

```xml
<!-- Good: elements breathe -->
<Style bodyColor="#ffffff" backgroundColor="#f1f5f9" bodyYPadding="24" />
<H1 paddingTop="8" paddingBottom="4">Welcome aboard</H1>
<Paragraph paddingBottom="16">Here is what happens next.</Paragraph>
<Button href="https://loops.so" bgColor="#0f172a" textColor="#ffffff" align="center" paddingTop="8" paddingBottom="24">Get started</Button>
```

---

## Copy And Punctuation

Avoid em dashes in generated copy unless the user explicitly asks for that punctuation. Prefer commas, colons, parentheses, or shorter sentences.

Do not add terminal periods to generated heading text in `<H1>`, `<H2>`, or `<H3>`. If source copy already contains heading punctuation, preserve it only when the user asks for exact copy preservation.

```xml
<!-- Good -->
<H1>Welcome aboard</H1>
<H2>Your setup checklist</H2>

<!-- Not this -->
<H1>Welcome aboard.</H1>
<H2>Your setup checklist.</H2>
```

---

## Rounded Column Layouts

LMX supports `blockColor` and `blockBorderRadius` on `<Columns>`. If you need a rounded two-column card, put the shared background and radius on `<Columns>` itself.

Avoid applying matching `blockBorderRadius` values to separate block elements inside each `<ColumnItem>` with the intention of rounding the whole column layout. Columns render as adjacent table cells; two independently rounded inner blocks placed side by side can produce awkward mismatched corners.

Avoid this pattern:

```xml
<!-- Bad - rounded inner blocks in columns look broken -->
<Columns gap="0" widths="50,50">
  <ColumnItem>
    <Paragraph blockColor="#e2e8f0" blockBorderRadius="12">Left</Paragraph>
  </ColumnItem>
  <ColumnItem>
    <Paragraph blockColor="#e2e8f0" blockBorderRadius="12">Right</Paragraph>
  </ColumnItem>
</Columns>
```

Use this pattern instead:

```xml
<Columns gap="24" widths="50,50" blockColor="#f8fafc" blockBorderRadius="12" paddingTop="16" paddingBottom="16">
  <ColumnItem>
    <Paragraph>Left</Paragraph>
  </ColumnItem>
  <ColumnItem>
    <Paragraph>Right</Paragraph>
  </ColumnItem>
</Columns>
```

Rounding is fine on standalone blocks (outside `<Columns>`), on `<Button>`, and on `<Image />`.

---

## Sections For Cards And Groups

Use `<Section>` when a design needs a card, group, or framed content area around multiple related blocks. Put the background, radius, padding, and optional link on the section instead of repeating the same styling on every child block.

```xml
<Section blockColor="#f8fafc" blockBorderRadius="12" paddingTop="16" paddingRight="16" paddingBottom="16" paddingLeft="16">
  <H2>Account summary</H2>
  <Paragraph>Your latest report is ready.</Paragraph>
  <Button href="https://example.com/report" bgColor="#0f172a" textColor="#ffffff">View report</Button>
</Section>
```

Do not nest `<Section>` inside another `<Section>`. If you need grouped content inside a card, use ordinary child blocks, lists, columns, or dividers within one section.

---

## CodeBlock Color Pairing

When you set a custom `blockColor` on a `<CodeBlock>`, visually pair it with the surrounding body:

- Light body (`bodyColor="#ffffff"`): use a subtle tinted block, e.g. `blockColor="#f8fafc"` or `blockColor="#f1f5f9"`. This creates separation without jarring contrast.
- Dark body (`bodyColor="#0f172a"`): use a slightly lighter dark, e.g. `blockColor="#1e293b"`.
- Avoid colorful block colors on `<CodeBlock>`; code should read as technical/neutral.

---

## Visual Hierarchy Summary

- One `<H1>` per document (unless the content genuinely has multiple top-level sections).
- Follow heading levels in order: `<H1>` -> `<H2>` -> `<H3>`. Don't skip levels for styling reasons; adjust `fontSize` instead.
- CTAs (`<Button>`) should stand out: high contrast, enough padding, aligned centrally for most transactional emails.
- Use `<Divider />` sparingly to separate distinct sections, not between every element.
- Keep icon rows (`<Icons>`) near the footer, typically the last or second-to-last block.
