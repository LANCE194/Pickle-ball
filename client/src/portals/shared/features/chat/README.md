# Messages

This shared portal feature adds one-to-one text chat for active users and is shown only when the club's `chat_messages` feature is enabled. The searchable contact picker loads eligible contacts automatically and can filter them by role.

Contact permissions are role-specific: Super Admin ↔ Admin; Admin → Staff, Players, and Coach/Referees; Staff → Admin, Players, and Coach/Referees; Players → Staff and Coach/Referees; Coach/Referees → Admin and Staff. Non-Super-Admin contacts are restricted to the same active club. A recipient can reply in an existing conversation even when their role cannot initiate that pairing.

The page uses the server's participant-authorized chat API. It does not expose email addresses or phone numbers, and it does not support attachments.
