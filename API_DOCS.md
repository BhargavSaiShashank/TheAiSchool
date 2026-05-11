# 🌐 PulseSend API Documentation

Welcome to the official API documentation for the **PulseSend Email Campaign Platform**. This documentation covers all authenticated, public, and transactional endpoints powering the infrastructure.

---

## 🔐 Authentication & Security

All non-public endpoints require a valid **Bearer Authentication Token** provided via **Clerk**.
Header format: `Authorization: Bearer <token>`

---

## 👥 Contact & List Management

### `GET /api/lists`
Retrieve a collection of all contact lists within the current organization scope.
- **Response**: Array of `List` objects containing `id`, `name`, and `contactCount`.

### `POST /api/lists`
Construct a new isolated marketing list.
- **Payload**: `{ "name": "New Year Newsletter" }`

### `GET /api/lists/:id`
Acquire analytical metrics and meta-context for an explicit list.

### `POST /api/contacts/import`
Execute a high-velocity CSV parsing job.
- **Payload**: `FormData` containing `file`, `listId`, and mapping data.

### `GET /api/contacts`
Query the master contact registry. 
- **Query Params**: `search`, `page`, `limit`.

---

## 🎨 Template Management

### `GET /api/templates`
Harvest global and private library assets.
- **Response**: Collection of template definitions, thumbnails, and categories.

### `POST /api/templates`
Commit a dynamic Unlayer payload to the physical template inventory.
- **Payload**: `{ "name": "Holiday Promo", "content": [JSON payload], "html": "<html>..." }`

### `DELETE /api/templates`
Permanent ejection of a template asset from the organization vault.
- **Auth**: Restricted to `SUPER_ADMIN` / `CAMPAIGN_MANAGER`.

---

## ✉️ Campaign Operations

### `GET /api/campaigns`
Retrieve the unified operational pipeline encompassing draft, scheduled, and completed deliveries.

### `POST /api/campaigns`
Initiate the orchestration of a new communication instance.
- **Payload**: `{ "name", "subject", "templateId", "recipients": [...] }`

### `GET /api/campaigns/:id/report`
Execute real-time telemetry harvesting. Aggregates open rates, click throughput, device metrics, and bounce velocity.

---

## 🛡️ Suppression & Reliability

### `GET /api/suppression`
Analyze the master blacklist vault, containing globally quarantined identifiers.

### `POST /api/webhooks/ses`
Global AWS Simple Email Service SNS destination handling dynamic ingestion of `Delivery`, `Bounce`, and `Complaint` payloads automatically updating physical user statuses.

---

## 📊 Analytics Gateway

### `GET /api/dashboard`
High-intensity telemetry pipeline feeding the main operational display. Distills total volume, conversion rate timelines, and real-time delivery speed curves.

---

## ⚡ Public Pipelines

### `GET /api/track/open`
Transparent pixel destination recording temporal engagement moments.

### `GET /api/track/click`
Dynamic traffic redirection hub facilitating programmatic click attribution.

### `GET /api/unsubscribe`
Transactional endpoint processing legislative compliance directives for explicit recipient removal.
