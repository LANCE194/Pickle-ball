const { query, tx } = require('../../../../config/db');
const { audit } = require('../../../../shared/services/audit');
const notification = require('../../../../shared/services/notification');
const { cleanText, HttpError } = require('../../../../shared/utils');

const CHAT_RECIPIENT_ROLES = {
  super_admin: ['admin'],
  admin: ['super_admin', 'staff', 'coach_referee', 'player'],
  staff: ['admin', 'player', 'coach_referee'],
  player: ['staff', 'coach_referee'],
  coach_referee: ['admin', 'staff'],
};

const nameSql = alias => `COALESCE(
  (SELECT trim(p.first_name || ' ' || p.last_name) FROM players p WHERE p.user_id=${alias}.id LIMIT 1),
  (SELECT trim(p.first_name || ' ' || p.last_name) FROM staff_profiles p WHERE p.user_id=${alias}.id LIMIT 1),
  (SELECT trim(p.first_name || ' ' || p.last_name) FROM referee_profiles p WHERE p.user_id=${alias}.id LIMIT 1),
  CASE WHEN ${alias}.role='super_admin' THEN 'DinkNest Support' ELSE replace(${alias}.role, '_', ' ') END
)`;

async function activeUser(userId) {
  const { rows } = await query(
    `SELECT u.id, u.role, u.club_id, u.status, c.status AS club_status
     FROM users u LEFT JOIN clubs c ON c.id=u.club_id WHERE u.id=$1`,
    [userId],
  );
  const user = rows[0];
  if (!user || user.status !== 'active' || (user.club_id && user.club_status !== 'active')) {
    throw new HttpError(403, 'Only active users can use chat.', 'CHAT_NOT_ALLOWED');
  }
  return user;
}

function canStartConversation(sender, recipient) {
  if (!sender || !recipient || !(CHAT_RECIPIENT_ROLES[sender.role] || []).includes(recipient.role)) return false;
  if (sender.role === 'super_admin') return recipient.role === 'admin';
  if (recipient.role === 'super_admin') return sender.role === 'admin';
  return !!sender.club_id && sender.club_id === recipient.club_id;
}

function canUseConversation(first, second) {
  return canStartConversation(first, second) || canStartConversation(second, first);
}

exports.searchUsers = async (user, value) => {
  const actor = await activeUser(user.id || user);
  const search = cleanText(value, 60).trim();
  const roles = CHAT_RECIPIENT_ROLES[actor.role] || [];
  if (!roles.length) return [];
  const { rows } = await query(
    `SELECT u.id, ${nameSql('u')} AS name, u.role, COALESCE(c.name, 'DinkNest') AS club_name
     FROM users u LEFT JOIN clubs c ON c.id=u.club_id
     WHERE u.status='active' AND (u.club_id IS NULL OR c.status='active') AND u.id<>$1
       AND u.role = ANY($2)
       AND (($3='super_admin' AND u.role='admin')
         OR ($3<>'super_admin' AND (u.role='super_admin' OR u.club_id=$4)))
       AND ($5='' OR lower(${nameSql('u')}) LIKE lower($6))
     ORDER BY name LIMIT $7`,
    [actor.id, roles, actor.role, actor.club_id, search, `%${search}%`, search ? 25 : 50],
  );
  return rows;
};

exports.listConversations = async userId => {
  const actor = await activeUser(userId);
  const { rows } = await query(
    `SELECT c.id, other.id AS other_user_id, ${nameSql('other')} AS other_name, other.role AS other_role,
       other.club_id AS other_club_id, other.status AS other_status, club.status AS other_club_status,
       COALESCE(club.name, 'DinkNest') AS other_club,
       (SELECT body FROM chat_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
       (SELECT created_at FROM chat_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
       (SELECT count(*) FROM chat_messages m WHERE m.conversation_id=c.id AND m.sender_id<>$1
          AND m.created_at>COALESCE(mine.last_read_at, '')) AS unread_count
     FROM chat_participants mine
     JOIN chat_conversations c ON c.id=mine.conversation_id
     JOIN chat_participants theirs ON theirs.conversation_id=c.id AND theirs.user_id<>mine.user_id
     JOIN users other ON other.id=theirs.user_id AND other.status='active'
     LEFT JOIN clubs club ON club.id=other.club_id
     WHERE mine.user_id=$1 AND (other.club_id IS NULL OR club.status='active')
     ORDER BY COALESCE((SELECT max(m.created_at) FROM chat_messages m WHERE m.conversation_id=c.id), c.updated_at) DESC`,
    [userId],
  );
  return rows.filter(other => other.other_status === 'active'
    && (!other.other_club_id || other.other_club_status === 'active')
    && canUseConversation(actor, {
      id: other.other_user_id,
      role: other.other_role,
      club_id: other.other_club_id,
    }));
};

exports.createConversation = async (user, recipientId) => {
  const actor = await activeUser(user.id || user);
  if (typeof recipientId !== 'string' || recipientId === actor.id) throw new HttpError(422, 'Choose another active user to start a conversation.', 'INVALID_RECIPIENT');
  const { rows: recipients } = await query(
    `SELECT u.id, u.role, u.club_id, u.status, c.status AS club_status FROM users u LEFT JOIN clubs c ON c.id=u.club_id
     WHERE u.id=$1 AND u.status='active' AND (u.club_id IS NULL OR c.status='active')`,
    [recipientId],
  );
  if (!recipients.length) throw new HttpError(404, 'That active user could not be found.', 'RECIPIENT_NOT_FOUND');
  if (!canStartConversation(actor, recipients[0])) {
    throw new HttpError(403, 'You cannot start a conversation with this role or club.', 'CHAT_NOT_ALLOWED');
  }
  const userId = actor.id;
  const [low, high] = [userId, recipientId].sort();
  const conversationId = await tx(async db => {
    let { rows } = await db.query(
      `INSERT INTO chat_conversations (participant_low, participant_high, created_by)
       VALUES ($1,$2,$3) ON CONFLICT(participant_low, participant_high) DO NOTHING RETURNING id`,
      [low, high, userId],
    );
    if (rows.length) {
      const id = rows[0].id;
      await db.query('INSERT INTO chat_participants (conversation_id, user_id, last_read_at) VALUES ($1,$2,now()), ($1,$3,NULL)', [id, userId, recipientId]);
      return id;
    }
    ({ rows } = await db.query('SELECT id FROM chat_conversations WHERE participant_low=$1 AND participant_high=$2', [low, high]));
    if (!rows.length) throw new Error('Conversation could not be created.');
    return rows[0].id;
  });
  return { id: conversationId };
};

async function conversationUsers(userId, conversationId) {
  const { rows } = await query(
    `SELECT u.id, u.role, u.club_id, u.status, club.status AS club_status
     FROM chat_participants p JOIN users u ON u.id=p.user_id
     LEFT JOIN clubs club ON club.id=u.club_id
     WHERE p.conversation_id=$1 ORDER BY u.id`,
    [conversationId],
  );
  const actor = rows.find(user => user.id === userId);
  const recipient = rows.find(user => user.id !== userId);
  if (!actor || !recipient || rows.length !== 2
      || actor.status !== 'active' || recipient.status !== 'active'
      || (actor.club_id && actor.club_status !== 'active')
      || (recipient.club_id && recipient.club_status !== 'active')
      || !canUseConversation(actor, recipient)) {
    throw new HttpError(404, 'Conversation not found.', 'CONVERSATION_NOT_FOUND');
  }
  return { actor, recipient };
}

exports.listMessages = async (userId, conversationId) => {
  await conversationUsers(userId, conversationId);
  const { rows } = await query(
    `SELECT m.id, m.sender_id, ${nameSql('u')} AS sender_name, u.role AS sender_role, m.body, m.created_at,
       a.id AS attachment_id, a.kind AS attachment_kind, a.file_name AS attachment_name, a.bytes AS attachment_bytes
     FROM chat_messages m JOIN users u ON u.id=m.sender_id
     LEFT JOIN chat_attachments a ON a.message_id=m.id
     WHERE m.conversation_id=$1 ORDER BY m.created_at DESC LIMIT 100`,
    [conversationId],
  );
  await query('UPDATE chat_participants SET last_read_at=now() WHERE conversation_id=$1 AND user_id=$2', [conversationId, userId]);
  return rows.reverse();
};

exports.sendMessage = async (req, conversationId, value) => {
  if (typeof value !== 'string') throw new HttpError(422, 'Enter a message before sending.', 'INVALID_MESSAGE');
  const body = cleanText(value, 2001).trim();
  if (!body || body.length > 2000) throw new HttpError(422, 'Messages must contain 1 to 2000 characters.', 'INVALID_MESSAGE');
  const { recipient } = await conversationUsers(req.user.id, conversationId);
  const recipientId = recipient.id;
  const result = await tx(async db => {
    const { rows } = await db.query(
      'INSERT INTO chat_messages (conversation_id, sender_id, body) VALUES ($1,$2,$3) RETURNING id, sender_id, body, created_at',
      [conversationId, req.user.id, body],
    );
    await db.query('UPDATE chat_conversations SET updated_at=now() WHERE id=$1', [conversationId]);
    await db.query('UPDATE chat_participants SET last_read_at=now() WHERE conversation_id=$1 AND user_id=$2', [conversationId, req.user.id]);
    return rows[0];
  });
  const { rows: senders } = await query(`SELECT ${nameSql('u')} AS name FROM users u WHERE u.id=$1`, [req.user.id]);
  await notification.notify(recipientId, 'New message', `${senders[0].name} sent you a message.`, 'chat', req.user.clubId);
  await audit(req, 'chat.message.send', 'chat_conversation', conversationId, { recipientId });
  return result;
};

