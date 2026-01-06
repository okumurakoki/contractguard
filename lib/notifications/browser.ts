/**
 * ブラウザ通知機能
 * Web Notification API を使用
 */

/**
 * 通知の許可をリクエスト
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * 通知の許可状態を取得
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

/**
 * ブラウザ通知を表示
 */
export function showNotification(options: NotificationOptions): Notification | null {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/icon-192.png',
    tag: options.tag,
    requireInteraction: options.requireInteraction,
  });

  if (options.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  return notification;
}

/**
 * 分析完了通知を表示
 */
export function showAnalysisCompleteNotification(params: {
  contractTitle: string;
  contractId: string;
  riskLevel: string;
}) {
  const { contractTitle, riskLevel, contractId } = params;

  const riskLabel =
    riskLevel === 'high' ? '高リスク' : riskLevel === 'medium' ? '中リスク' : '低リスク';

  return showNotification({
    title: '契約書分析完了',
    body: `「${contractTitle}」の分析が完了しました。リスクレベル: ${riskLabel}`,
    tag: `analysis-${contractId}`,
    onClick: () => {
      window.location.href = `/contracts/${contractId}`;
    },
  });
}

/**
 * 高リスク検出通知を表示
 */
export function showHighRiskNotification(params: {
  contractTitle: string;
  contractId: string;
  riskCount: number;
}) {
  const { contractTitle, contractId, riskCount } = params;

  return showNotification({
    title: '高リスク項目を検出',
    body: `「${contractTitle}」で${riskCount}件の高リスク項目が検出されました。確認してください。`,
    tag: `high-risk-${contractId}`,
    requireInteraction: true,
    onClick: () => {
      window.location.href = `/contracts/${contractId}`;
    },
  });
}

/**
 * 相談リマインダー通知を表示
 */
export function showConsultationReminderNotification(params: {
  lawyerName: string;
  scheduledAt: Date;
}) {
  const { lawyerName, scheduledAt } = params;

  const formattedTime = scheduledAt.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return showNotification({
    title: '相談リマインダー',
    body: `${lawyerName}弁護士との相談が${formattedTime}に予定されています。`,
    tag: 'consultation-reminder',
    requireInteraction: true,
    onClick: () => {
      window.location.href = '/lawyer/consultation';
    },
  });
}

/**
 * 契約書有効期限通知を表示
 */
export function showExpiryNotification(params: {
  contractTitle: string;
  contractId: string;
  daysUntilExpiry: number;
}) {
  const { contractTitle, contractId, daysUntilExpiry } = params;

  return showNotification({
    title: '契約書有効期限通知',
    body: `「${contractTitle}」の有効期限まで残り${daysUntilExpiry}日です。`,
    tag: `expiry-${contractId}`,
    onClick: () => {
      window.location.href = `/contracts/${contractId}`;
    },
  });
}
