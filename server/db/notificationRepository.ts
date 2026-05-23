import { db } from './db';
import crypto from 'crypto';

export interface NotificationDeliveryInput {
  type: string;
  channel?: string;
  title: string;
  messagePreview: string;
  messageHash: string;
  source: 'protocol_payload' | 'static_fallback' | 'demo_simulated' | 'unknown';
  deliveryStatus: 'sent' | 'failed' | 'fallback_sent' | 'simulated' | 'blocked';
  telegramOk?: boolean | null;
  scheduledTaskName?: string | null;
  actionRunId?: string | null;
  stdoutSummary?: string | null;
  stderrSummary?: string | null;
  errorMessage?: string | null;
}

export const logNotificationDelivery = (delivery: NotificationDeliveryInput) => {
  const now = new Date().toISOString();
  const date = now.split('T')[0];
  const id = crypto.randomUUID().replace(/-/g, '');

  db.prepare(`
    INSERT INTO notification_deliveries (
      id, date, type, channel, title, message_preview, message_hash, 
      source, delivery_status, telegram_ok, scheduled_task_name, 
      action_run_id, stdout_summary, stderr_summary, error_message, 
      sent_at, created_at
    )
    VALUES (
      @id, @date, @type, @channel, @title, @message_preview, @message_hash,
      @source, @delivery_status, @telegram_ok, @scheduled_task_name,
      @action_run_id, @stdout_summary, @stderr_summary, @error_message,
      @sent_at, @created_at
    )
  `).run({
    id,
    date,
    type: delivery.type,
    channel: delivery.channel || 'telegram',
    title: delivery.title,
    message_preview: delivery.messagePreview.substring(0, 500),
    message_hash: delivery.messageHash,
    source: delivery.source,
    delivery_status: delivery.deliveryStatus,
    telegram_ok: delivery.telegramOk === undefined ? null : delivery.telegramOk ? 1 : 0,
    scheduled_task_name: delivery.scheduledTaskName || null,
    action_run_id: delivery.actionRunId || null,
    stdout_summary: delivery.stdoutSummary || null,
    stderr_summary: delivery.stderrSummary || null,
    error_message: delivery.errorMessage || null,
    sent_at: now,
    created_at: now
  });

  return id;
};

export const getNotificationDeliveriesByDate = (date: string) => {
  return db.prepare('SELECT * FROM notification_deliveries WHERE date = ? ORDER BY sent_at DESC').all(date);
};

export const getTodayNotificationDeliveries = () => {
  const today = new Date().toISOString().split('T')[0];
  return getNotificationDeliveriesByDate(today);
};

export const getLatestNotificationDeliveries = (limit = 25) => {
  return db.prepare('SELECT * FROM notification_deliveries ORDER BY sent_at DESC LIMIT ?').all(limit);
};

export const getDeliveryById = (id: string) => {
  return db.prepare('SELECT * FROM notification_deliveries WHERE id = ?').get(id);
};

export const getNotificationStats = (days = 14) => {
  const today = new Date().toISOString().split('T')[0];
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - days);
  const fromDate = pastDate.toISOString().split('T')[0];

  const deliveries = db.prepare('SELECT * FROM notification_deliveries WHERE date >= ? ORDER BY sent_at DESC').all(fromDate) as any[];

  const todayDeliveries = deliveries.filter(d => d.date === today);
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  
  let protocolPayloadCount = 0;
  let staticFallbackCount = 0;
  let sentToday = 0;
  let failedToday = 0;
  let fallbackToday = 0;
  let simulatedToday = 0;

  todayDeliveries.forEach(d => {
    byType[d.type] = (byType[d.type] || 0) + 1;
    byStatus[d.delivery_status] = (byStatus[d.delivery_status] || 0) + 1;

    if (d.source === 'protocol_payload') protocolPayloadCount++;
    if (d.source === 'static_fallback') staticFallbackCount++;

    if (d.delivery_status === 'sent') sentToday++;
    if (d.delivery_status === 'failed') failedToday++;
    if (d.delivery_status === 'fallback_sent') fallbackToday++;
    if (d.delivery_status === 'simulated') simulatedToday++;
  });

  return {
    deliveriesToday: todayDeliveries.length,
    sentToday,
    failedToday,
    fallbackToday,
    simulatedToday,
    protocolPayloadCount,
    staticFallbackCount,
    lastDeliveryAt: deliveries.length > 0 ? deliveries[0].sent_at : null,
    byType,
    byStatus,
    recentCount: deliveries.length
  };
};
