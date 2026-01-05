'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Shield, CheckCircle } from '@mui/icons-material';

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: { code: string; message: string; longMessage?: string }[] };
      const errorCode = clerkError.errors?.[0]?.code;
      const errorMessage = clerkError.errors?.[0]?.message;
      const longMessage = clerkError.errors?.[0]?.longMessage;

      console.error('Sign-up error:', { errorCode, errorMessage, longMessage, fullError: err });

      // エラーコードに応じた詳細なメッセージを表示
      if (errorCode === 'session_exists') {
        setError('既にログインしています。新しいアカウントを作成するには、一度サインアウトしてください。');
      } else if (errorCode === 'captcha_invalid') {
        setError('セキュリティ検証に失敗しました。ページを更新して再度お試しください。');
      } else if (errorCode === 'form_password_pwned') {
        setError('このパスワードは漏洩データに含まれています。別のパスワードをお使いください。');
      } else if (errorCode === 'form_identifier_exists') {
        setError('このメールアドレスは既に登録されています。');
      } else {
        setError(errorMessage || '登録に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || '認証コードが正しくありません');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
      }}
    >
      {/* 左側：登録フォーム */}
      <Box
        sx={{
          width: { xs: '100%', md: '45%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, sm: 6, md: 8 },
          py: 4,
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ maxWidth: 400, width: '100%', mx: 'auto' }}>
          {/* ロゴ */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
            <Shield sx={{ fontSize: 32, color: '#000' }} />
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: '#000', letterSpacing: '-0.02em' }}
            >
              はじめて.AI REGAL
            </Typography>
          </Box>

          {!pendingVerification ? (
            <>
              {/* タイトル */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#000',
                  mb: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                無料で始めよう
              </Typography>
              <Typography
                sx={{
                  color: '#6b7280',
                  mb: 4,
                  fontSize: '1rem',
                }}
              >
                30秒で登録完了。クレジットカード不要。
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Typography
                  sx={{ fontWeight: 500, color: '#374151', mb: 1, fontSize: '0.875rem' }}
                >
                  メールアドレス
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f9fafb',
                      '&:hover fieldset': { borderColor: '#000' },
                      '&.Mui-focused fieldset': { borderColor: '#000', borderWidth: 2 },
                    },
                  }}
                />

                <Typography
                  sx={{ fontWeight: 500, color: '#374151', mb: 1, fontSize: '0.875rem' }}
                >
                  パスワード
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8文字以上で入力"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#9ca3af' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f9fafb',
                      '&:hover fieldset': { borderColor: '#000' },
                      '&.Mui-focused fieldset': { borderColor: '#000', borderWidth: 2 },
                    },
                  }}
                />

                {/* Clerk Bot Protection CAPTCHA - must be a plain div for Clerk SDK */}
                <div
                  id="clerk-captcha"
                  data-cl-theme="light"
                  data-cl-size="flexible"
                  data-cl-language="ja-JP"
                  style={{ marginBottom: '16px', minHeight: '65px' }}
                />

                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    bgcolor: '#000',
                    color: '#fff',
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '1rem',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#1f2937' },
                    '&:disabled': { bgcolor: '#9ca3af' },
                  }}
                >
                  {loading ? '処理中...' : '無料で登録'}
                </Button>

                <Typography
                  sx={{
                    textAlign: 'center',
                    mt: 3,
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                  }}
                >
                  登録することで、
                  <Link href="/terms" sx={{ color: '#6b7280' }}>利用規約</Link>
                  および
                  <Link href="/privacy" sx={{ color: '#6b7280' }}>プライバシーポリシー</Link>
                  に同意したものとみなされます。
                </Typography>
              </Box>
            </>
          ) : (
            <>
              {/* 認証コード入力 */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#000',
                  mb: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                メールを確認
              </Typography>
              <Typography
                sx={{
                  color: '#6b7280',
                  mb: 4,
                  fontSize: '1rem',
                }}
              >
                {email} に認証コードを送信しました
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleVerification}>
                <Typography
                  sx={{ fontWeight: 500, color: '#374151', mb: 1, fontSize: '0.875rem' }}
                >
                  認証コード
                </Typography>
                <TextField
                  fullWidth
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  required
                  sx={{
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f9fafb',
                      '&:hover fieldset': { borderColor: '#000' },
                      '&.Mui-focused fieldset': { borderColor: '#000', borderWidth: 2 },
                    },
                    '& input': {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      letterSpacing: '0.5rem',
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    bgcolor: '#000',
                    color: '#fff',
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '1rem',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#1f2937' },
                    '&:disabled': { bgcolor: '#9ca3af' },
                  }}
                >
                  {loading ? '確認中...' : 'アカウントを作成'}
                </Button>
              </Box>
            </>
          )}

          <Typography
            sx={{
              textAlign: 'center',
              mt: 4,
              color: '#6b7280',
              fontSize: '0.875rem',
            }}
          >
            すでにアカウントをお持ちの方は{' '}
            <Link
              href="/sign-in"
              sx={{
                color: '#000',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              ログイン
            </Link>
          </Typography>
        </Box>
      </Box>

      {/* 右側：ヒーローセクション（PC表示のみ） */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '55%',
          bgcolor: '#000',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 背景パターン */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `
              radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
              radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* グラデーションオーバーレイ */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.9) 100%)',
          }}
        />

        {/* コンテンツ */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'left',
            px: 6,
            maxWidth: 500,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: '#fff',
              fontWeight: 700,
              mb: 4,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            契約書レビューを
            <br />
            もっと簡単に
          </Typography>

          {/* 特徴リスト */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { title: 'AIが瞬時に分析', desc: 'アップロードするだけで数分で完了' },
              { title: 'リスクを可視化', desc: '問題箇所をハイライトで明確に表示' },
              { title: '修正案を提案', desc: '専門家レベルの代替条文を自動生成' },
              { title: '弁護士に相談可能', desc: '必要に応じて専門家へ直接相談' },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <CheckCircle sx={{ color: '#22c55e', fontSize: 24, mt: 0.25 }} />
                <Box>
                  <Typography
                    sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem', mb: 0.5 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                    {item.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* 信頼性 */}
          <Box
            sx={{
              mt: 6,
              pt: 4,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
              多くの企業に選ばれています
            </Typography>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1.5rem' }}>
              500社以上が導入
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
