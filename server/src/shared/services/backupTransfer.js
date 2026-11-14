const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../../config/env');
const { query, tx } = require('../../config/db');
const backups = require('./backups');
const { audit } = require('./audit');
const notification = require('./notification');
const { cleanText, HttpError } = require('../utils');

async function findAttachment(userId, attachmentId) {
  const { rows } = await query(
    `SELECT a.id, a.kind, a.file_name, a.storage_path, a.bytes, a.conversation_id
     FROM chat_attachments a
     JOIN chat_participants p ON p.conversation_id=a.conversation_id AND p.user_id=$1
     WHERE a.id=$2`,
    [userId, attachmentId],
  );
  const attachment = rows[0];
  if (!attachment || !/^chat-backups\/[0-9a-f-]{36}\.dnclub\.gz$/i.test(attachment.storage_path)) {
    throw new HttpError(404, 'Attachment not found.', 'ATTACHMENT_NOT_FOUND');
  }
  const file = path.resolve(env.storageDir, ...attachment.storage_path.split('/'));
  const root = path.resolve(env.storageDir) + path.sep;
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw new HttpError(404, 'Attachment not found.', 'ATTACHMENT_NOT_FOUND');
  }
  return { ...attachment, file };
}

exports.sendClubBackupToSuperAdmin = async (req, backup) => {
  if (!req.user || req.user.role !== 'admin' || !req.user.clubId || req.user.clubId !== backup.clubId) {
    throw new HttpError(403, 'Only an Admin can share a backup of their own club.', 'BACKUP_SHARE_FORBIDDEN');
  }
  const payload = backups.decodeArchive(backup.buffer, 'club');
  if (!payload.club || payload.club.id !== req.user.clubId || !archiveName(backup.name)) {
    throw new HttpError(422, 'The club backup does not match your club.', 'INVALID_BACKUP');
  }
  const { rows: recipients } = await query(`SELECT id FROM users WHERE role='super_admin' AND status='active'`);
  if (!recipients.length) throw new HttpError(409, 'There is no active Super Admin to receive this backup.', 'SUPER_ADMIN_UNAVAILABLE');
  const recipientId = recipients[0].id;
  const [low, high] = [req.user.id, recipientId].sort();
  const conversationId = await tx(async client => {
    await client.query(
      `INSERT INTO chat_conversations (participant_low, participant_high, created_by)
       VALUES ($1,$2,$3) ON CONFLICT(participant_low, participant_high) DO NOTHING`,
      [low, high, req.user.id],
    );
    const { rows } = await client.query(
      'SELECT id FROM chat_conversations WHERE participant_low=$1 AND participant_high=$2',
      [low, high],
    );
    if (!rows[0]) throw new Error('The Super Admin conversation could not be created.');
    await client.query(
      'INSERT INTO chat_participants (conversation_id, user_id, last_read_at) VALUES ($1,$2,now()), ($1,$3,NULL) ON CONFLICT(conversation_id,user_id) DO NOTHING',
      [rows[0].id, req.user.id, recipientId],
    );
    return rows[0].id;
  });
  const relativePath = `chat-backups/${crypto.randomUUID()}.dnclub.gz`;
  const target = path.join(env.storageDir, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, backup.buffer, { flag: 'wx' });
  let message;
  try {
    message = await tx(async client => {
      const { rows } = await client.query(
        'INSERT INTO chat_messages (conversation_id, sender_id, body) VALUES ($1,$2,$3) RETURNING id, sender_id, body, created_at',
        [conversationId, req.user.id, `Shared a club backup for ${cleanText(payload.club.name, 100)}.`],
      );
      await client.query(
        'INSERT INTO chat_attachments (conversation_id, message_id, uploaded_by, kind, file_name, storage_path, bytes) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [conversationId, rows[0].id, req.user.id, 'club_backup', backup.name, relativePath, backup.buffer.length],
      );
      await client.query('UPDATE chat_conversations SET updated_at=now() WHERE id=$1', [conversationId]);
      return rows[0];
    });
  } catch (error) {
    if (fs.existsSync(target)) fs.unlinkSync(target);
    throw error;
  }
  const { rows: senders } = await query(
    `SELECT COALESCE(
       (SELECT trim(p.first_name || ' ' || p.last_name) FROM players p WHERE p.user_id=u.id LIMIT 1),
       (SELECT trim(p.first_name || ' ' || p.last_name) FROM staff_profiles p WHERE p.user_id=u.id LIMIT 1),
       (SELECT trim(p.first_name || ' ' || p.last_name) FROM referee_profiles p WHERE p.user_id=u.id LIMIT 1),
       replace(u.role, '_', ' ')
     ) AS name FROM users u WHERE u.id=$1`,
    [req.user.id],
  );
  await notification.notify(recipientId, 'Club backup received', `${senders[0].name} shared a club backup.`, 'chat', req.user.clubId);
  await audit(req, 'chat.backup.send', 'chat_conversation', conversationId, { file_name: backup.name });
  const { rows: attachments } = await query('SELECT id FROM chat_attachments WHERE message_id=$1', [message.id]);
  return { ...message, conversationId, attachmentId: attachments[0].id };
};

function archiveName(name) {
  return typeof name === 'string' && /^dinknest-club-[\w-]+\.dnclub\.gz$/.test(name) ? name : null;
}

exports.attachmentFile = async (userId, attachmentId) => {
  const attachment = await findAttachment(userId, attachmentId);
  return { file: attachment.file, name: attachment.file_name };
};

exports.clubBackupAttachment = async (user, attachmentId) => {
  if (!user || user.role !== 'super_admin') throw new HttpError(403, 'Only a Super Admin can import a club backup.', 'FORBIDDEN');
  const attachment = await findAttachment(user.id, attachmentId);
  if (attachment.kind !== 'club_backup' || !archiveName(attachment.file_name)) {
    throw new HttpError(422, 'This chat attachment is not a DinkNest club backup.', 'INVALID_BACKUP');
  }
  return fs.readFileSync(attachment.file);
};
