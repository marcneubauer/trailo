# Trailo — REST API Specification

## Base URL

```
/api/v1
```

## Authentication

All endpoints except auth registration/login require a valid session cookie (`trailo_session`). Unauthenticated requests receive `401 Unauthorized`.

## Error Response Format

All error responses follow this shape:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

Common error codes:
- `VALIDATION_ERROR` — request body failed Zod validation (details contains field errors)
- `UNAUTHORIZED` — no valid session
- `FORBIDDEN` — authenticated but not authorized for this resource
- `NOT_FOUND` — resource does not exist
- `CONFLICT` — resource already exists (e.g., duplicate email)

---

## Auth Endpoints

### POST /api/v1/auth/register

Register a new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "alice",
  "password": "securepassword123"
}
```

**Validation:**
- `email`: valid email format, max 255 chars
- `username`: 3-30 chars, alphanumeric + hyphens + underscores
- `password`: 8-128 chars

**Response (201):**
```json
{
  "user": { "id": "abc123", "email": "user@example.com", "username": "alice" }
}
```
Sets `trailo_session` cookie.

**Errors:** `409 CONFLICT` (email or username taken), `400 VALIDATION_ERROR`

### POST /api/v1/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "user": { "id": "abc123", "email": "user@example.com", "username": "alice" }
}
```
Sets `trailo_session` cookie.

**Errors:** `401 UNAUTHORIZED` (invalid credentials)

### POST /api/v1/auth/logout

Destroys the current session. Requires authentication.

**Response (200):**
```json
{ "ok": true }
```

### GET /api/v1/auth/me

Returns the currently authenticated user.

**Response (200):**
```json
{
  "user": { "id": "abc123", "email": "user@example.com", "username": "alice" }
}
```

### POST /api/v1/auth/passkey/register/options

Get WebAuthn registration options. Requires authentication.

**Response (200):** SimpleWebAuthn `PublicKeyCredentialCreationOptionsJSON`

### POST /api/v1/auth/passkey/register/verify

Verify WebAuthn registration. Requires authentication.

**Request:** SimpleWebAuthn `RegistrationResponseJSON`

**Response (200):**
```json
{ "verified": true }
```

### POST /api/v1/auth/passkey/login/options

Get WebAuthn authentication options. No auth required.

**Request (optional):**
```json
{ "email": "user@example.com" }
```

**Response (200):** SimpleWebAuthn `PublicKeyCredentialRequestOptionsJSON`

### POST /api/v1/auth/passkey/login/verify

Verify WebAuthn authentication. No auth required.

**Request:** SimpleWebAuthn `AuthenticationResponseJSON`

**Response (200):**
```json
{
  "user": { "id": "abc123", "email": "user@example.com", "username": "alice" }
}
```
Sets `trailo_session` cookie.

---

## Board Endpoints

All require authentication. Users can only access their own boards.

### GET /api/v1/boards

List all boards for the authenticated user.

**Response (200):**
```json
{
  "boards": [
    {
      "id": "board1",
      "name": "My Board",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### POST /api/v1/boards

Create a new board.

**Request:**
```json
{ "name": "My Board" }
```

**Validation:** `name`: 1-100 chars, trimmed

**Response (201):**
```json
{
  "board": {
    "id": "board1",
    "name": "My Board",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### GET /api/v1/boards/:boardId

Get a board with all its lists and cards, sorted by position.

**Response (200):**
```json
{
  "board": {
    "id": "board1",
    "name": "My Board",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "lists": [
      {
        "id": "list1",
        "name": "To Do",
        "position": "a0",
        "cards": [
          {
            "id": "card1",
            "title": "First task",
            "description": null,
            "position": "a0"
          }
        ]
      }
    ]
  }
}
```

**Errors:** `404 NOT_FOUND`, `403 FORBIDDEN`

### PATCH /api/v1/boards/:boardId

Update a board's name.

**Request:**
```json
{ "name": "Updated Board Name" }
```

**Response (200):** Updated board object (same shape as POST response)

### DELETE /api/v1/boards/:boardId

Delete a board and all its lists and cards (cascade).

**Response (200):**
```json
{ "ok": true }
```

---

## List Endpoints

All require authentication. Authorization checked via board ownership.

### POST /api/v1/boards/:boardId/lists

Create a new list at the end of the board.

**Request:**
```json
{ "name": "To Do" }
```

**Validation:** `name`: 1-100 chars, trimmed

**Response (201):**
```json
{
  "list": {
    "id": "list1",
    "name": "To Do",
    "boardId": "board1",
    "position": "a0",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

Position is automatically calculated as after the last existing list.

### PATCH /api/v1/lists/:listId

Update a list's name.

**Request:**
```json
{ "name": "In Progress" }
```

**Response (200):** Updated list object

### PATCH /api/v1/lists/:listId/reorder

Update a list's position (used after drag-and-drop).

**Request:**
```json
{ "position": "aN" }
```

**Response (200):** Updated list object

### DELETE /api/v1/lists/:listId

Delete a list and all its cards (cascade).

**Response (200):**
```json
{ "ok": true }
```

---

## Card Endpoints

All require authentication. Authorization checked via list → board ownership.

### POST /api/v1/lists/:listId/cards

Create a new card at the end of the list.

**Request:**
```json
{
  "title": "My Task",
  "description": "Optional description"
}
```

**Validation:**
- `title`: 1-500 chars, trimmed
- `description`: optional, max 5000 chars

**Response (201):**
```json
{
  "card": {
    "id": "card1",
    "title": "My Task",
    "description": "Optional description",
    "listId": "list1",
    "position": "a0",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### PATCH /api/v1/cards/:cardId

Update a card's title and/or description.

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response (200):** Updated card object

### PATCH /api/v1/cards/:cardId/move

Move or reorder a card. Handles both within-list reordering and cross-list moves.

**Request:**
```json
{
  "listId": "list2",
  "position": "aN"
}
```

- `listId`: target list (same list = reorder, different list = move)
- `position`: new fractional index position

**Response (200):** Updated card object

### DELETE /api/v1/cards/:cardId

Delete a card.

**Response (200):**
```json
{ "ok": true }
```
