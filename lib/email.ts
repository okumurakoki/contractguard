import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'ContractGuard <noreply@contractguard.jp>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendInvitationEmailParams {
  to: string;
  inviterName: string;
  organizationName: string;
  token: string;
  role: string;
}

export async function sendInvitationEmail({
  to,
  inviterName,
  organizationName,
  token,
  role,
}: SendInvitationEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Skipping email send.');
    return { success: true }; // 開発環境ではスキップ
  }

  const inviteUrl = `${APP_URL}/invite/${token}`;
  const roleLabel = role === 'admin' ? '管理者' : role === 'editor' ? '編集者' : '閲覧者';

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `【ContractGuard】${organizationName}への招待`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #1e40af; }
    .content { background: #f8fafc; border-radius: 12px; padding: 32px; margin-bottom: 32px; }
    .button { display: inline-block; background: #1e40af; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    .footer { text-align: center; color: #64748b; font-size: 14px; }
    .role-badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 4px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ContractGuard</div>
    </div>
    <div class="content">
      <p>${inviterName}さんから<strong>${organizationName}</strong>への招待が届いています。</p>
      <p>あなたは<span class="role-badge">${roleLabel}</span>として招待されました。</p>
      <p style="margin: 32px 0; text-align: center;">
        <a href="${inviteUrl}" class="button">招待を承諾する</a>
      </p>
      <p style="font-size: 14px; color: #64748b;">
        このリンクは7日間有効です。<br>
        心当たりがない場合は、このメールを無視してください。
      </p>
    </div>
    <div class="footer">
      <p>ContractGuard - AI契約書レビューサービス</p>
      <p style="font-size: 12px;">
        このメールは自動送信されています。返信はできません。
      </p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Failed to send invitation email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: 'メール送信に失敗しました' };
  }
}
