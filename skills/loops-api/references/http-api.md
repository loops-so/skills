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

#### List transactional emails

```
GET /v1/transactional?perPage=20&cursor=...
```

Paginated list of published transactional emails. `perPage` must be between 10 and 50. Default is 20. Use this to find `transactionalId` values.

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
      "lastUpdated": "...",
      "dataVariables": ["firstName", "trialEnd"]
    }
  ]
}
```

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

Attachments must be enabled on your account before use. Contact `help@loops.so` to enable them.

Supports the `Idempotency-Key` header the same way as events.

### Content API Email Messages

#### Update an email message

```
POST /email-messages/{emailMessageId}
```

Use this for draft campaign email messages when setting subject, preview text, sender, and LMX content. Include `expectedRevisionId` from the latest `contentRevisionId` to avoid stale writes. For the first update after `POST /campaigns`, use the returned `emailMessageContentRevisionId`.

```jsonc
{
  "expectedRevisionId": "rev_123",
  "subject": "Welcome",
  "previewText": "A quick start guide",
  "fromName": "Loops",
  "fromEmail": "updates",
  "replyToEmail": "support@example.com",
  "lmx": "<Paragraph>Hello</Paragraph>"
}
```

`fromEmail` is the sender username only, without `@` or a domain. The team's sending domain is appended automatically. LMX compile failures, including missing required LMX attributes such as `<Image src>`, `<Component componentId>`, `<Icon name>`, or `<Link href>`, return HTTP 422.

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
| 404 | Not found | Contact, transactional email, or email message ID does not exist |
| 409 | Conflict | Email or userId already exists, idempotency key was reused, campaign is not draft, content cannot be parsed, or `expectedRevisionId` is stale |
| 422 | LMX failed to compile | Fix invalid LMX, missing required LMX attributes, or XML escaping |
| 429 | Rate limited | Back off and retry |
| CORS error | Client-side request | Move the API call to your server |

Most v1 contact, event, and transactional request body string values are limited to **500 characters**. LMX content on email-message updates follows the LMX payload limit.

---

## Tips

- **Upsert pattern**: Use `PUT /v1/contacts/update` when you are not sure if a contact exists.
- **`addToAudience` on transactional**: Setting this to `true` when sending a transactional email will make sure the recipient is added to the audience for marketing emails.
- **Finding your `transactionalId`**: Go to the Loops dashboard -> Transactional, or call `GET /v1/transactional`.
- **`fromEmail` on email messages**: Pass only the sender username, such as `"updates"`, not `"updates@example.com"`.
- **Mailing list membership**: Pass `{ "list_id": true }` to subscribe and `{ "list_id": false }` to unsubscribe.
- **Event name matching**: The `eventName` must match the configured Loops trigger exactly.
- **Idempotency keys**: Use these any time an operation could be retried, such as webhook handlers or confirmation flows.
