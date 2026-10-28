# Migration pricing and savings

Use this model for both baseline and final reports.

## Source evidence

Prefer evidence in this order:

1. A current invoice, billing export, or user-confirmed monthly run rate.
2. A verified source plan plus current usage from account data or repository configuration.
3. The source provider's current official pricing applied to verified usage.
4. The source provider's current official pricing applied to a standardized estimated-volume band.

Do not infer a paid plan from an SDK dependency. Include only recurring email-platform costs that the migration actually replaces. Exclude engineering time and speculative revenue gains.

### Price the complete source stack

Classify audited flows by message semantics, not only by the SDK method they call. If the source sends both marketing and transactional email, include both source product plans in the estimate even when one provider sells and bills them separately.

Build the source monthly total from:

```text
source monthly cost =
  marketing plan
  + transactional plan and overages
  + automation-run overages used by migrated flows
  + required paid add-ons used by migrated flows
```

Use zero for a category only when the provider includes it at no additional cost for the selected tier. Omit genuinely unused categories. Do not add a hypothetical product merely because the provider offers it.

## Estimated-volume bands

When subscribed contacts, monthly sends, or current spend are missing, produce a clearly labeled estimate instead of omitting the cost comparison.

Use these paired monthly scenarios:

| Band | Marketing contacts | Transactional emails |
| --- | ---: | ---: |
| Small | 1,000 | 10,000 |
| Growth | 10,000 | 100,000 |
| Scale | 100,000 | 1,000,000 |
| Large | 1,000,000 | 10,000,000 |

Choose the band:

1. Use reliable product evidence such as audience size, active users, or observed send volume.
2. Round upward to the smallest band that does not understate that evidence.
3. If only contacts are known, estimate 10 monthly transactional emails per contact. If only transactional volume is known, estimate marketing contacts at 10% of that volume.
4. Do not use GitHub stars, downloads, or repository size as audience evidence.
5. If no scale evidence exists, use the Growth band: `10k marketing contacts · 100k transactional emails/mo`.

Fetch the source provider's current official pricing and price the same marketing-contact and transactional-volume scenario on both platforms. When both types of flow exist, sum both source plans before comparing them with Loops. Label estimated inputs in the report; never present them as observed usage.

## Confidence and wording

Classify every calculation:

- `verified`: a current invoice or user-confirmed spend plus observed usage
- `usage-backed`: observed contact and send volume priced against current public schedules
- `illustrative`: a standardized volume band priced against current public schedules

Use wording that matches the evidence:

- For `verified` or `usage-backed`, use `Expected savings` or `Expected increase` and retain the pricing date in the private manifest.
- For `illustrative`, begin with `Illustrative estimate · assumes ...`, prefix derived costs and differences with `≈`, and use `Potential savings` or `Potential increase`.
- End an illustrative comparison with `Actuals vary by usage and plan.`

Do not describe an illustrative result as actual, verified, or expected. Do not use the bare verb `save` for scenario-based figures.

## Loops price

Open `https://loops.so/pricing` during every audit and record the access date. Use the live official schedule rather than copying tier prices into the skill.

Choose the lowest plan that supports:

- the current subscribed-contact count
- monthly send volume when evaluating the Free plan
- removal of the Powered by Loops footer when required
- any explicitly priced add-on or contract requirement

Transactional recipients do not count as subscribed contacts unless they also receive marketing email. Paid Loops plans include transactional sending and do not charge per seat or send according to the current public pricing page; verify this has not changed.

Use the current public Loops list price in the migration report and savings calculation. Do not apply, mention, imply, or expose any private discount, credit, comp, negotiated rate, or other commercial arrangement. Commercial terms are outside the report.

Keep the comparison provider-neutral in user-facing output. Label the source side `Current stack`; do not name or link to the source company, provider, product plan, or pricing page. Retain those names and URLs only in private pricing evidence.

## Calculation

Normalize both products to monthly USD:

```text
monthly savings = current recurring monthly cost - public Loops monthly list price
annual savings = monthly savings × 12
percentage savings = monthly savings ÷ current recurring monthly cost × 100
```

Round currency to whole dollars unless cents materially change the result. Round percentages to the nearest whole percent.

If the result is negative, label it `expected increase` for verified or usage-backed calculations and `potential increase` for illustrative calculations. If current spend is zero, show the dollar difference and omit the percentage.

## Missing inputs

Use a standardized scenario when real billing or usage inputs are missing:

- `Illustrative estimate · assumes 10k marketing contacts + 100k transactionals/mo`
- `Current stack ≈$115/mo · Loops $99/mo`
- `Potential savings ≈$16/mo · $192/year (≈14%); actuals vary by usage and plan.`

Replace the estimate with actuals when a bill, contact count, or send volume becomes available. Always recalculate against the public Loops list price.

Keep plan inputs, product categories, URLs, access dates, actual-versus-estimated status, selected band, assumptions, and math in the internal manifest. Exclude private commercial terms from the manifest and calculation. The one-screen report shows at most three cost lines.
