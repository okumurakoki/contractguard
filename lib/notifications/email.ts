import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'ContractGuard <noreply@contractguard.jp>';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * メールを送信する
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

/**
 * AI分析完了通知を送信
 */
export async function sendAnalysisCompleteNotification(params: {
  to: string;
  contractTitle: string;
  contractId: string;
  riskLevel: string;
  overallScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}) {
  const {
    to,
    contractTitle,
    contractId,
    riskLevel,
    overallScore,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
  } = params;

  const riskColor =
    riskLevel === 'high' ? '#dc2626' : riskLevel === 'medium' ? '#f59e0b' : '#22c55e';
  const riskLabel =
    riskLevel === 'high' ? '高リスク' : riskLevel === 'medium' ? '中リスク' : '低リスク';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 16px; font-weight: bold; }
        .stats { display: flex; gap: 16px; margin: 16px 0; }
        .stat-item { text-align: center; padding: 12px; background: white; border-radius: 8px; flex: 1; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>契約書の分析が完了しました</h1>
        </div>
        <div class="content">
          <h2>${contractTitle}</h2>
          <p>
            リスクレベル:
            <span class="risk-badge" style="background: ${riskColor}20; color: ${riskColor};">
              ${riskLabel}
            </span>
          </p>
          <p>総合スコア: <strong>${overallScore}/100</strong></p>

          <div class="stats">
            <div class="stat-item">
              <div class="stat-value" style="color: #dc2626;">${highRiskCount}</div>
              <div>高リスク</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: #f59e0b;">${mediumRiskCount}</div>
              <div>中リスク</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: #22c55e;">${lowRiskCount}</div>
              <div>低リスク</div>
            </div>
          </div>

          <p style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts/${contractId}" class="button">
              詳細を確認する
            </a>
          </p>
        </div>
        <div class="footer">
          <p>このメールはContractGuardから自動送信されています。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `[ContractGuard] 契約書分析完了: ${contractTitle}`,
    html,
    text: `契約書「${contractTitle}」の分析が完了しました。リスクレベル: ${riskLabel}、総合スコア: ${overallScore}/100`,
  });
}

/**
 * 弁護士相談リマインダーを送信
 */
export async function sendConsultationReminder(params: {
  to: string;
  lawyerName: string;
  consultationType: string;
  scheduledAt: Date;
  consultationId: string;
}) {
  const { to, lawyerName, consultationType, scheduledAt, consultationId } = params;

  const typeLabel =
    consultationType === 'video'
      ? 'ビデオ相談'
      : consultationType === 'chat'
        ? 'チャット相談'
        : '契約書レビュー';

  const formattedDate = scheduledAt.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const formattedTime = scheduledAt.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>相談のリマインダー</h1>
        </div>
        <div class="content">
          <p>明日、弁護士との相談が予定されています。</p>

          <div class="info-box">
            <div class="info-row">
              <span>弁護士</span>
              <strong>${lawyerName}</strong>
            </div>
            <div class="info-row">
              <span>相談タイプ</span>
              <strong>${typeLabel}</strong>
            </div>
            <div class="info-row">
              <span>日時</span>
              <strong>${formattedDate} ${formattedTime}</strong>
            </div>
          </div>

          <p style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/lawyer/consultation" class="button">
              詳細を確認する
            </a>
          </p>
        </div>
        <div class="footer">
          <p>このメールはContractGuardから自動送信されています。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `[ContractGuard] 明日の相談リマインダー: ${lawyerName}弁護士`,
    html,
    text: `明日 ${formattedDate} ${formattedTime} に ${lawyerName}弁護士との${typeLabel}が予定されています。`,
  });
}

/**
 * 契約書有効期限リマインダーを送信
 */
export async function sendExpiryReminder(params: {
  to: string;
  contractTitle: string;
  contractId: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}) {
  const { to, contractTitle, contractId, expiryDate, daysUntilExpiry } = params;

  const formattedDate = expiryDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const urgencyColor = daysUntilExpiry <= 7 ? '#dc2626' : daysUntilExpiry <= 30 ? '#f59e0b' : '#3b82f6';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${urgencyColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .countdown { text-align: center; padding: 20px; }
        .countdown-number { font-size: 48px; font-weight: bold; color: ${urgencyColor}; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>契約書の有効期限が近づいています</h1>
        </div>
        <div class="content">
          <h2>${contractTitle}</h2>

          <div class="countdown">
            <div class="countdown-number">${daysUntilExpiry}</div>
            <div>日後に有効期限切れ</div>
            <div style="color: #6b7280; margin-top: 8px;">${formattedDate}</div>
          </div>

          <p>契約の更新または終了について、必要な対応をご確認ください。</p>

          <p style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts/${contractId}" class="button">
              契約書を確認する
            </a>
          </p>
        </div>
        <div class="footer">
          <p>このメールはContractGuardから自動送信されています。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `[ContractGuard] 契約書有効期限通知: ${contractTitle} (残り${daysUntilExpiry}日)`,
    html,
    text: `契約書「${contractTitle}」の有効期限が${formattedDate}（残り${daysUntilExpiry}日）に迫っています。`,
  });
}
