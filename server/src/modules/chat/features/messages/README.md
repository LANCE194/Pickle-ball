# Direct messages

The `chat_messages` feature provides one-to-one text conversations for authenticated, active users. The server applies role-specific recipient and conversation checks:

- Super Admin can start conversations with Admins across active clubs; Admins can also start conversations with the Super Admin.
- Admin can start conversations with their club's Staff, Players, and Coach/Referees.
- Staff can start conversations with their club's Admin, Players, and Coach/Referees.
- Players can start conversations with their club's Staff and Coach/Referees.
- Coach/Referees can start conversations with their club's Admin and Staff.
- A recipient may reply in an existing conversation. All other non-Super-Admin conversations are limited to one active club.

## API

- `GET /api/chat/messages/users` returns up to 50 eligible active contacts for the caller's role; `?search=<name>` searches up to 25 matches. The response includes only ID, display name, role, and club name.
- `GET /api/chat/messages/conversations` lists the caller's conversations and unread counts.
- `POST /api/chat/messages/conversations` with `{ "userId": "..." }` opens or reuses a direct conversation.
- `GET /api/chat/messages/conversations/:id/messages` returns up to 100 messages and marks them read.
- `POST /api/chat/messages/conversations/:id/messages` with `{ "body": "..." }` sends a plain-text message (maximum 2,000 characters).

Every conversation operation requires participant membership and a role-permitted pairing. Inactive users and inactive clubs are not discoverable or eligible recipients. Notifications contain no message text.
