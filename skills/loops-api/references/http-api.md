# Loops HTTP API and SDK Reference

## Contents

- Source URLs
- Authentication
- Base URL
- Rate Limits
- Official SDKs
- Endpoints
- Code Examples
- Common Errors
- Tips

## Source URLs

- https://loops.so/docs/api-reference/intro
- https://loops.so/docs/api-reference/examples/campaigns
- https://loops.so/docs/api-reference/examples/transactional-emails
- https://loops.so/docs/sdks/javascript
- https://loops.so/docs/sdks/nuxt
- https://loops.so/docs/sdks/php
- https://loops.so/docs/sdks/ruby
- https://app.loops.so/openapi.json

## Authentication

Every request needs your Loops API key as a Bearer token.

Generate one at: **Settings -> API** in your Loops account.

```
Authorization: Bearer YOUR_API_KEY
```

Never hardcode API keys in source code or expose them client-side. Always load from environment variables or a secrets manager. The Loops API requires server-side requests. Browser-side calls will hit CORS errors by design.

```bash
export LOOPS_API_KEY="your-api-key-here"
```

## Base URL

```
https://app.loops.so/api
```

## Rate Limits

**10 requests per second per team.** Responses include `x-ratelimit-limit` and `x-ratelimit-remaining` headers. On limit, you will get HTTP 429, so implement exponential backoff retries.

## Official SDKs

Use an official SDK when the user's language has one:

- **JavaScript/TypeScript**: `npm install loops`
- **Nuxt**: `npm install nuxt-loops`
- **PHP**: `composer require loops-so/loops`
- **Ruby**: `gem install loops_sdk`

If the user is working from the shell instead of application code, use the separate `loops-cli` skill.

---

## Endpoints

### Test API key

```
GET /v1/api-key
```

Returns `{ success: true, teamName: "..." }` on success. Use this to confirm credentials are working.

### Contacts

#### Create a contact

```
POST /v1/contacts/create
```

```jsonc
{
  "email": "user@example.com",
  "firstName": "Alex",
  "lastName": "Chen",
  "subscribed": true,
  "userGroup": "premium",
  "userId": "usr_123",
  "mailingLists": { "cm_abc123": true },
  "customProperty": "value"
}
```

Returns `{ success: true, id: "contact_id" }`.
Returns `409` if `email` or `userId` already exists. Use `PUT /v1/contacts/update` instead.

#### Update a contact

```
PUT /v1/contacts/update
```

Same body shape as create. Include `email` or `userId` to identify the contact. This works as an upsert, so if the contact does not exist it will be created.

If you need to change a contact's email address, the contact must already have a `userId`. Send the update request with that `userId` and the new `email` value.

#### Find a contact

```
GET /v1/contacts/find?email=user%40example.com
GET /v1/contacts/find?userId=usr_123
```

Only one parameter is allowed. Email must be URI-encoded.

```json
[
  {
    "id": "...",
    "email": "user@example.com",
    "firstName": "Alex",
    "lastName": "Chen",
    "source": "api",
    "subscribed": true,
    "userGroup": "premium",
    "userId": "usr_123",
    "mailingLists": { "cm_abc123": true },
    "optInStatus": "accepted"
  }
]
```

#### Delete a contact

```
POST /v1/contacts/delete
```

```json
{
  "email": "user@example.com"
}
```

Provide exactly one of `email` or `userId`, not both.

#### Contact suppression status and removal

```
GET /v1/contacts/suppression?email=user%40example.com
GET /v1/contacts/suppression?userId=usr_123
DELETE /v1/contacts/suppression?email=user%40example.com
DELETE /v1/contacts/suppression?userId=usr_123
```

Use the `GET` endpoint to inspect suppression state and current removal quota (`limit` and `remaining`).
Use the `DELETE` endpoint to remove a suppressed contact by `email` or `userId`.
Both endpoints require exactly one identifier (`email` or `userId`).

### Contact Properties

#### List properties

```
GET /v1/contacts/properties?list=all
```

`list` can be `"all"` (default) or `"custom"`.

Returns `[{ key, label, type }]`.

#### Create a property

```
POST /v1/contacts/properties
```

```jsonc
{
  "name": "planTier",
  "type": "string"
}
```

Custom property names should be camelCase. Valid types are `"string"`, `"number"`, `"boolean"`, and `"date"`.

### Mailing Lists

#### List mailing lists

```
GET /v1/lists
```

Returns `[{ id, name, description, isPublic }]`. Use the `id` values in `mailingLists` objects.

### Dedicated Sending IPs

#### List dedicated sending IP addresses

```
GET /v1/dedicated-sending-ips
```

Example response:

```json
["1.2.3.4", "5.6.7.8"]
```

### Events

#### Send an event

```
POST /v1/events/send
```

Events trigger email automations configured in Loops. The event name must match the configured trigger exactly.

```jsonc
{
  "email": "user@example.com",
  "userId": "usr_123",
  "eventName": "signup",
  "eventProperties": {
    "plan": "pro",
    "trialDays": 14
  },
  "mailingLists": { "list_123": true },
  "firstName": "Alex"
}
```

Fields inside `eventProperties` are scoped to the event. Top-level fields like `firstName` update the contact record permanently.

To avoid duplicate sends on retries, pass an idempotency key:

```
Idempotency-Key: unique-id-max-100-chars
```

Returns `409` if the same key was used before.

### Transactional Emails

#### Send a transactional email

```
POST /v1/transactional
```

```jsonc
{
  "email": "user@example.com",
  "transactionalId": "cll42l54f20i1la0lfooe3z12",
  "addToAudience": true,
  "dataVariables": {
    "firstName": "Alex",
    "resetLink": "https://..."
  },
  "attachments": [
    {
      "filename": "invoice.pdf",
      "contentType": "application/pdf",
      "data": "<base64-encoded-content>"
    }
  ]
}
```

`email` and `transactionalId` are required. `addToAudience: true` creates a contact from `email` if one does not already exist.

Attachments must be enabled on your account before use. Contact `help@loops.so` to enable them.

Supports the `Idempotency-Key` header (max 100 characters) the same way as events. Returns `400` if the transactional email is not published.

#### List transactional emails

```
GET /v1/transactional-emails?perPage=20&cursor=...
```

Preferred endpoint. Returns a paginated list of transactional emails, most recently created first. `perPage` must be between 10 and 50. Default is 20. Use this to find `transactionalId` values and inspect draft/published state.

```json
{
  "pagination": {
    "totalResults": 42,
    "returnedResults": 20,
    "perPage": 20,
    "totalPages": 3,
    "nextCursor": "abc...",
    "nextPage": "https://..."
  },
  "data": [
    {
      "id": "cll42l54f20i1la0lfooe3z12",
      "name": "Welcome email",
      "draftEmailMessageId": null,
      "publishedEmailMessageId": "em_abc123",
      "createdAt": "2025-02-02T02:56:28.845Z",
      "updatedAt": "2025-02-02T03:10:00.000Z",
      "dataVariables": ["firstName", "trialEnd"]
    }
  ]
}
```

`dataVariables` lists variable names from the published email. It is empty for unpublished transactional emails.

Legacy (deprecated):

```
GET /v1/transactional?perPage=20&cursor=...
```

Returns only published transactional emails with `id`, `name`, `lastUpdated`, and `dataVariables`. Prefer `GET /v1/transactional-emails`.

#### Creating and managing transactional emails

The API lets you create transactional email templates, edit their draft content, and publish them from code.

A sending domain must be configured before creating transactional emails or editing drafts.

For LMX markup rules, use the separate `loops-lmx` skill.

##### Typical workflow

1. `POST /v1/transactional-emails` with `{ "name": "..." }` — creates the transactional email and an empty draft email message. Save `id`, `draftEmailMessageId`, and `draftEmailMessageContentRevisionId`.
2. `GET /v1/themes` and `GET /v1/components` — discover `themeId` and `componentId` values for LMX (optional).
3. `POST /v1/email-messages/{draftEmailMessageId}` — set subject, sender fields, and `lmx`; pass `draftEmailMessageContentRevisionId` as `expectedRevisionId` on the first update.
4. After each successful update, save the returned `contentRevisionId` and pass it as `expectedRevisionId` on the next update.
5. `POST /v1/transactional-emails/{transactionalId}/publish` — publish the draft. The draft becomes the published version and the draft is cleared.
6. `POST /v1/transactional` — send the published email using the returned `id` as `transactionalId`.

To edit a published transactional email later, call `POST /v1/transactional-emails/{transactionalId}/draft` to ensure a draft exists (seeded from the published version when present), update the draft via `/v1/email-messages/{emailMessageId}`, then publish again.

##### Create a transactional email

```
POST /v1/transactional-emails
```

```jsonc
{
  "name": "Welcome email"
}
```

Returns `201` with `id`, `draftEmailMessageId`, `draftEmailMessageContentRevisionId`, `publishedEmailMessageId` (null until published), timestamps, and `dataVariables`.

##### Get a transactional email

```
GET /v1/transactional-emails/{transactionalId}
```

Returns `id`, `name`, `draftEmailMessageId`, `publishedEmailMessageId`, timestamps, and `dataVariables`.

##### Update a transactional email

```
POST /v1/transactional-emails/{transactionalId}
```

```jsonc
{
  "name": "Renamed welcome email"
}
```

Updates the transactional email name only.

##### Ensure a draft email message

```
POST /v1/transactional-emails/{transactionalId}/draft
```

If a draft already exists, returns it unchanged. Otherwise creates a new empty draft, seeded from the most recent published version when present. Returns `draftEmailMessageId` and `draftEmailMessageContentRevisionId` for editing via `/v1/email-messages/{emailMessageId}`.

##### Publish a transactional email draft

```
POST /v1/transactional-emails/{transactionalId}/publish
```

Publishes the current draft. Returns `409` if there is no draft to publish. Returns `422` if the draft fails validation, the sending domain is not verified, or content was flagged as unsafe.

### Creating and editing campaigns

The API lets you create draft campaigns and set email-message content (subject, sender, preview text, LMX) from code.

A sending domain must be configured before creating campaigns or reading email messages. Campaign and email-message writes only work while the campaign is in **Draft** status.

For LMX markup rules and design guidance, use the separate `loops-lmx` skill. Copy/paste workflow examples: [Campaigns API examples](https://loops.so/docs/api-reference/examples/campaigns).

#### Typical workflow

1. `POST /v1/campaigns` with `{ "name": "..." }` — saves `emailMessageId` and `emailMessageContentRevisionId`.
2. `GET /v1/themes` and `GET /v1/components` — discover `themeId` and `componentId` values for LMX.
3. `POST /v1/email-messages/{emailMessageId}` — set subject, sender fields, and `lmx`; pass `emailMessageContentRevisionId` as `expectedRevisionId` on the first update.
4. After each successful update, save the returned `contentRevisionId` and pass it as `expectedRevisionId` on the next update to avoid `409 Conflict` from stale revisions.

#### Campaigns

##### List campaigns

```
GET /v1/campaigns?perPage=20&cursor=...
```

`perPage` must be between 10 and 50 (default 20). Returns paginated `data` with `campaignId`, `emailMessageId`, `name`, `subject`, `status`, and timestamps. Status values include `Draft`, `Scheduled`, `Sending`, and `Sent`.

##### Create a campaign

```
POST /v1/campaigns
```

Only `name` is required. Creates a draft campaign and an empty email message in one request.

```jsonc
{
  "name": "Spring product announcement"
}
```

Returns `201` with `campaignId`, `emailMessageId`, and `emailMessageContentRevisionId`. Save both IDs and the revision ID for the first email-message update.

##### Get a campaign

```
GET /v1/campaigns/{campaignId}
```

##### Update a campaign

```
POST /v1/campaigns/{campaignId}
```

Updates the draft campaign name only. Returns `409` if the campaign is not in draft status.

```jsonc
{
  "name": "Renamed announcement"
}
```

#### Email messages

##### Get an email message

```
GET /v1/email-messages/{emailMessageId}
```

Returns subject, preview text, sender fields, `lmx`, `contentRevisionId`, and `campaignId`. Returns `409` if the message uses legacy MJML format or content cannot be parsed.

##### Update an email message

```
POST /v1/email-messages/{emailMessageId}
```

Updates draft email-message fields. All body fields are optional in the schema, but you should send the fields you intend to change together with a valid `expectedRevisionId`.

```jsonc
{
  "expectedRevisionId": "rev_123",
  "subject": "Big spring updates",
  "previewText": "A quick look at what's new",
  "fromName": "Loops",
  "fromEmail": "hello",
  "replyToEmail": "support@example.com",
  "lmx": "<Style themeId=\"default\" />\n<Paragraph><Text>Hey there.</Text></Paragraph>\n<Component componentId=\"logo\" />"
}
```

`fromEmail` is the sender username only, without `@` or a domain. The team's sending domain is appended automatically.

On success, the response includes a new `contentRevisionId` and may include non-fatal `warnings` from LMX compilation. LMX compile failures (invalid tags, missing required attributes such as `<Image src>`, `<Component componentId>`, `<Icon name>`, or `<Link href>`) return HTTP `422`. LMX payloads larger than **100 KB** return HTTP `413`.

#### Themes

##### List themes

```
GET /v1/themes?perPage=20&cursor=...
```

Returns paginated themes (most recently created first). Use `themeId` in `<Style themeId="..." />`.

##### Get a theme

```
GET /v1/themes/{themeId}
```

Returns theme metadata and style values (colors, fonts, button styles, etc.) for reference when building LMX.

#### Components

##### List components

```
GET /v1/components?perPage=20&cursor=...
```

Returns paginated reusable components. Use `componentId` in `<Component componentId="..." />`.

##### Get a component

```
GET /v1/components/{componentId}
```

Returns `componentId`, `name`, and the component body as LMX.

#### Uploads

Use uploads to add image assets for LMX and email content.

Supported `contentType` values: `image/jpeg`, `image/png`, `image/gif`, and `image/webp`.

`contentLength` must be a positive integer no greater than **4,000,000 bytes** (4 MB). Returns `413` when the size limit is exceeded.

Upload rate limit: **50 uploads per 24 hours** per team. Returns `429` with `maxUploads` and `windowHours` when exceeded. Contact support to raise the limit.

##### Create an upload

```
POST /v1/uploads
```

```jsonc
{
  "contentType": "image/png",
  "contentLength": 102400
}
```

Returns `emailAssetId` and a `presignedUrl`. Upload the file with HTTP `PUT` to the returned `presignedUrl`, using the same `Content-Type` and `Content-Length` values.

Returns `400` for invalid request bodies or unsupported `contentType` (response may include `supportedContentTypes`).

##### Complete an upload

```
POST /v1/uploads/{id}/complete
```

Use the returned `emailAssetId` as `{id}` to finalize after the `PUT` upload succeeds. Success returns `emailAssetId` and `finalUrl`, which you can use in LMX `<Image url="..." />` attributes.

Returns `400` if the upload id is missing or the uploaded file has an unsupported content type. Returns `404` if the upload is not found.

---

## Code Examples

### JavaScript SDK

```typescript
import { LoopsClient } from "loops";

const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

await loops.sendEvent({
  email: "user@example.com",
  eventName: "paidSubscription",
  eventProperties: { planName: "pro" },
});

await loops.createContact({
  email: "user@example.com",
  properties: {
    firstName: "Alex",
    userGroup: "premium",
  },
  mailingLists: { list_123: true },
});

await loops.sendTransactionalEmail({
  transactionalId: "cll42l54f20i1la0lfooe3z12",
  email: "user@example.com",
  dataVariables: { resetLink: "https://yourapp.com/reset?token=abc" },
});
```

### Creating and editing a campaign

```javascript
const headers = {
  Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
  "Content-Type": "application/json",
};

const created = await fetch("https://app.loops.so/api/v1/campaigns", {
  method: "POST",
  headers,
  body: JSON.stringify({ name: "Spring product announcement" }),
}).then((r) => r.json());

const [themes, components] = await Promise.all([
  fetch("https://app.loops.so/api/v1/themes?perPage=20", { headers }).then((r) =>
    r.json()
  ),
  fetch("https://app.loops.so/api/v1/components?perPage=20", { headers }).then(
    (r) => r.json()
  ),
]);

// Upload an image to Loops and include the image URL in the LMX.
// Flow: create upload -> PUT to presignedUrl -> complete upload.
const imageBytes = /* Uint8Array|ArrayBuffer|Buffer */;
const contentType = "image/png";
const contentLength = imageBytes.byteLength ?? imageBytes.length;

const createdUpload = await fetch("https://app.loops.so/api/v1/uploads", {
  method: "POST",
  headers,
  body: JSON.stringify({ contentType, contentLength }),
}).then((r) => r.json());

// Upload the file to the pre-signed URL using HTTP PUT.
// Important: use the same Content-Type and Content-Length from the create call.
await fetch(createdUpload.presignedUrl, {
  method: "PUT",
  headers: {
    "Content-Type": contentType,
    "Content-Length": String(contentLength),
  },
  body: imageBytes,
});

// Finalize the asset and get the public URL.
const completedUpload = await fetch(
  `https://app.loops.so/api/v1/uploads/${createdUpload.emailAssetId}/complete`,
  { method: "POST", headers }
).then((r) => r.json());

const imageUrl = completedUpload.finalUrl;

const lmx = `
<Style themeId="default" />
<Paragraph><Text>Hey there, here is what's new.</Text></Paragraph>
<Image url="${imageUrl}" alt="New product showcase" />
<Component componentId="logo" />`;

const updated = await fetch(
  `https://app.loops.so/api/v1/email-messages/${created.emailMessageId}`,
  {
    method: "POST",
    headers,
    body: JSON.stringify({
      expectedRevisionId: created.emailMessageContentRevisionId,
      subject: "Big spring updates",
      previewText: "A quick look at what's new",
      fromName: "Loops",
      fromEmail: "hello",
      replyToEmail: "support@example.com",
      lmx,
    }),
  }
).then((r) => r.json());

// Save updated.contentRevisionId for the next update.
```

### Creating and publishing a transactional email

```javascript
const headers = {
  Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
  "Content-Type": "application/json",
};

const created = await fetch("https://app.loops.so/api/v1/transactional-emails", {
  method: "POST",
  headers,
  body: JSON.stringify({ name: "Password reset" }),
}).then((r) => r.json());

await fetch(
  `https://app.loops.so/api/v1/email-messages/${created.draftEmailMessageId}`,
  {
    method: "POST",
    headers,
    body: JSON.stringify({
      expectedRevisionId: created.draftEmailMessageContentRevisionId,
      subject: "Reset your password",
      fromName: "Loops",
      fromEmail: "hello",
      lmx: '<Style themeId="default" />\n<Paragraph><Text>Click {dataVariables.resetLink} to reset.</Text></Paragraph>',
    }),
  }
);

const published = await fetch(
  `https://app.loops.so/api/v1/transactional-emails/${created.id}/publish`,
  { method: "POST", headers }
).then((r) => r.json());

// Send using the transactional email id.
await fetch("https://app.loops.so/api/v1/transactional", {
  method: "POST",
  headers,
  body: JSON.stringify({
    email: "user@example.com",
    transactionalId: published.id,
    dataVariables: { resetLink: "https://yourapp.com/reset?token=abc" },
  }),
});
```

### Next.js App Router event send

```typescript
// app/api/register/route.ts
import { LoopsClient } from "loops";
import { NextResponse } from "next/server";

const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

export async function POST(req: Request) {
  const { email, plan } = await req.json();

  await loops.sendEvent({
    email,
    eventName: "signup",
    eventProperties: { plan },
  });

  return NextResponse.json({ success: true });
}
```

All Loops API calls must be server-side.

### Stripe webhook example

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from "stripe";
import { LoopsClient } from "loops";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;
    const planName = session.metadata?.planName;

    if (customerEmail) {
      await loops.sendEvent({
        email: customerEmail,
        eventName: "paidSubscription",
        eventProperties: { planName },
      });
    }
  }

  return new Response("ok");
}
```

This example uses the Next.js App Router. If you are using the Pages Router, use the corresponding `pages/api` handler shape and disable body parsing so Stripe signature verification still works.

### Python

```python
import os
import requests

LOOPS_API_KEY = os.environ["LOOPS_API_KEY"]
BASE_URL = "https://app.loops.so/api"
headers = {
    "Authorization": f"Bearer {LOOPS_API_KEY}",
    "Content-Type": "application/json",
}

resp = requests.post(
    f"{BASE_URL}/v1/transactional",
    headers=headers,
    json={
        "email": "user@example.com",
        "transactionalId": "cll42l54f20i1la0lfooe3z12",
        "dataVariables": {
            "resetLink": "https://yourapp.com/reset?token=abc123"
        },
    },
)
resp.raise_for_status()
```

### curl

```bash
curl -X POST https://app.loops.so/api/v1/events/send \
  -H "Authorization: Bearer $LOOPS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","eventName":"signup","eventProperties":{"plan":"pro"}}'

curl -X POST https://app.loops.so/api/v1/contacts/create \
  -H "Authorization: Bearer $LOOPS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","firstName":"Alex","subscribed":true,"mailingLists":{"cm_abc123":true}}'
```

---

## Common Errors

| Status | Meaning | Fix |
| --- | --- | --- |
| 401 | Invalid API key | Check the key is correct and has not been revoked |
| 400 | Bad request | Check required fields and value types |
| 404 | Not found | Contact, transactional email, campaign, theme, component, email message, or upload ID does not exist |
| 409 | Conflict | Email or userId already exists, idempotency key was reused, campaign is not draft, transactional email has no draft to publish, email message uses MJML or content cannot be parsed, or `expectedRevisionId` is stale |
| 413 | Payload too large | LMX body exceeds 100 KB, or upload `contentLength` exceeds 4 MB |
| 422 | LMX failed to compile | Fix invalid LMX, missing required LMX attributes, or XML escaping |
| 429 | Rate limited | Back off and retry |
| CORS error | Client-side request | Move the API call to your server |

Most v1 contact, event, and transactional request body string values are limited to **500 characters**. LMX content on email-message updates follows the LMX payload limit.

---

## Tips

- **Upsert pattern**: Use `PUT /v1/contacts/update` when you are not sure if a contact exists.
- **`addToAudience` on transactional**: Setting this to `true` when sending a transactional email will make sure the recipient is added to the audience for marketing emails.
- **Finding your `transactionalId`**: Go to the Loops dashboard -> Transactional, or call `GET /v1/transactional-emails`.
- **Transactional email lifecycle**: Create with `POST /v1/transactional-emails`, edit the draft via `/v1/email-messages/{draftEmailMessageId}`, publish with `POST /v1/transactional-emails/{id}/publish`, then send with `POST /v1/transactional`.
- **Upload limits**: Max file size is 4 MB. Max 50 uploads per 24 hours per team.
- **`fromEmail` on email messages**: Pass only the sender username, such as `"updates"`, not `"updates@example.com"`.
- **Content revision IDs**: After `POST /v1/campaigns`, use `emailMessageContentRevisionId` as the first `expectedRevisionId`. After each `POST /v1/email-messages/{id}`, save `contentRevisionId` for the next update.
- **Themes and components before LMX**: List themes and components first so `<Style themeId="..." />` and `<Component componentId="..." />` reference real IDs.
- **Draft-only writes**: Campaign and email-message updates return `409` once a campaign leaves draft status.
- **Mailing list membership**: Pass `{ "list_id": true }` to subscribe and `{ "list_id": false }` to unsubscribe.
- **Event name matching**: The `eventName` must match the configured Loops trigger exactly.
- **Idempotency keys**: Use these any time an operation could be retried, such as webhook handlers or confirmation flows.
