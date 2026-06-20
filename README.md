# Creator Card Microservice

A REST API that lets creators publish a shareable profile card showcasing their
links and service rates ("link-in-bio" cards with rate cards attached). Built on
the Resilience 17 backend template (Node.js + Express + MongoDB), following the
template's clean-architecture conventions.

## Tech stack

- **Node.js** (vanilla JS) + **Express** via the template's `@app-core/server`
- **MongoDB** + **Mongoose** via `@app-core/mongoose` (repository pattern)
- **VSL** (`@app-core/validator`) for field-level validation
- **ULID** identifiers, stored as `_id`, always serialized as `id`

## API

Base URL: the root of your deployment (no versioning, no auth).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/creator-cards` | Create a Creator Card |
| `GET` | `/creator-cards/:slug` | Publicly retrieve a card by slug |
| `DELETE` | `/creator-cards/:slug` | Delete a card by slug |

### `POST /creator-cards`

```json
{
  "title": "George Cooks",
  "description": "Weekly cooking podcast by Chef George",
  "slug": "george-cooks",
  "creator_reference": "crt_8f2k1m9x4p7w3q5z",
  "links": [{ "title": "YouTube", "url": "https://youtube.com/@georgecooks" }],
  "service_rates": {
    "currency": "NGN",
    "rates": [
      { "name": "IG Story Post", "description": "One story mention", "amount": 5000000 }
    ]
  },
  "status": "published",
  "access_type": "public"
}
```

Returns `HTTP 200` with the created card (including `access_code` when the card is
private). If `slug` is omitted it is auto-generated from the title; if provided and
already taken, returns `SL02`.

### `GET /creator-cards/:slug`

Public retrieval. Private cards require the pin as a query parameter:

```
GET /creator-cards/george-cooks?access_code=A1B2C3
```

`access_code` is **never** included in retrieval responses. Drafts and deleted
cards are not retrievable.

### `DELETE /creator-cards/:slug`

```json
{ "creator_reference": "crt_8f2k1m9x4p7w3q5z" }
```

Returns `HTTP 200` with the deleted card in the creation response format (with
`deleted` set). Deleted cards subsequently return `404 NF01` on retrieval.

### Response envelopes

```jsonc
// success
{ "status": "success", "message": "Creator Card Created Successfully.", "data": { /* card */ } }

// business-rule error
{ "status": "error", "message": "Slug is already taken", "code": "SL02" }
```

## Validation & business rules

Field-level validation (types, required fields, lengths, enums) is handled by the
VSL spec in each service and returns **HTTP 400** on failure. The following
business rules are implemented in the services and carry custom codes:

| Rule | Code | HTTP |
|------|------|------|
| Slug already taken | `SL02` | 400 |
| `access_code` required when `access_type` is private | `AC01` | 400 |
| `access_code` set on a public card | `AC05` | 400 |
| Card not found (or deleted) | `NF01` | 404 |
| Card exists but is a draft | `NF02` | 404 |
| Private card, access code required | `AC03` | 403 |
| Invalid access code | `AC04` | 403 |

Retrieval access rules are applied strictly in order: `NF01 → NF02 → AC03 → AC04`.

## Project layout (this solution)

```
models/creator-card.js                     # ULID _id, unique-indexed slug, paranoid soft-delete
repository/creator-card/index.js           # repository-factory binding
services/creator-card/
  create-creator-card.js                   # create + business rules
  get-creator-card.js                      # public retrieval + access control
  delete-creator-card.js                   # delete (returns deleted card)
  error-codes.js                           # custom business-rule codes
services/utils/
  serialize-creator-card.js                # _id -> id, deleted -> null, access_code gating
  generate-unique-slug.js                  # slug auto-generation + uniqueness
messages/creator-card.js                   # success + error messages
endpoints/creator-card/                    # POST / GET / DELETE handlers
```

### A note on the framework

The template's `server.js` did not emit the documented top-level `code` field on
error responses (see the error-response contract in the template guide). A minimal
change surfaces `error.errorCode` as `code`, and `@app-core/errors` maps the
`NF01/NF02/AC03/AC04` codes to their HTTP statuses. This aligns the framework with
its own documented error contract.

## Getting started

Prerequisites: Node.js v16+, a MongoDB instance (e.g. MongoDB Atlas free tier).

```bash
npm install
cp .env.example .env   # then set PORT and MONGODB_URI
node bootstrap.js
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Port the server listens on |
| `MONGODB_URI` | MongoDB connection string |

All other variables in `.env.example` are optional for this service.

## Deployment

Deploy to Render/Heroku or similar. The included `Procfile` runs
`web: node bootstrap.js`. Set `MONGODB_URI` (and `PORT` if required by the
platform). Endpoints live at the **root** of the base URL with no versioning and
require no authentication.
