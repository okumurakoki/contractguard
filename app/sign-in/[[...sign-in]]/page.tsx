'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
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
import { Visibility, VisibilityOff, Shield } from '@mui/icons-material';

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { code: string; message: string; longMessage?: string }[] };
      const errorCode = clerkError.errors?.[0]?.code;
      const errorMessage = clerkError.errors?.[0]?.message;
      const longMessage = clerkError.errors?.[0]?.longMessage;

      console.error('Sign-in error:', { errorCode, errorMessage, longMessage, fullError: err });

      // エラーコードに応じた詳細なメッセージを表示
      if (errorCode === 'session_exists') {
        setError('既にログインしています。');
      } else if (errorCode === 'form_identifier_not_found') {
        setError('このメールアドレスは登録されていません。');
      } else if (errorCode === 'form_password_incorrect') {
        setError('パスワードが正しくありません。');
      } else if (errorCode === 'captcha_invalid') {
        setError('セキュリティ検証に失敗しました。ページを更新して再度お試しください。');
      } else {
        setError(errorMessage || 'ログインに失敗しました');
      }
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
      {/* 左側：ログインフォーム */}
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
            おかえりなさい
          </Typography>
          <Typography
            sx={{
              color: '#6b7280',
              mb: 4,
              fontSize: '1rem',
            }}
          >
            アカウントにログインして契約書レビューを続けましょう
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                パスワード
              </Typography>
              <Link
                href="/forgot-password"
                sx={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  '&:hover': { color: '#000' },
                }}
              >
                パスワードを忘れた方
              </Link>
            </Box>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </Box>

          <Typography
            sx={{
              textAlign: 'center',
              mt: 4,
              color: '#6b7280',
              fontSize: '0.875rem',
            }}
          >
            アカウントをお持ちでない方は{' '}
            <Link
              href="/sign-up"
              sx={{
                color: '#000',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              新規登録
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
            textAlign: 'center',
            px: 6,
            maxWidth: 500,
          }}
        >
          {/* アイコン */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              bgcolor: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 4,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Shield sx={{ fontSize: 40, color: '#fff' }} />
          </Box>

          <Typography
            variant="h3"
            sx={{
              color: '#fff',
              fontWeight: 700,
              mb: 3,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            契約リスクを
            <br />
            AIが即座に検出
          </Typography>

          <Typography
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '1.125rem',
              lineHeight: 1.7,
              mb: 6,
            }}
          >
            専門家レベルの契約書レビューを、
            <br />
            誰でも簡単に。数分で完了。
          </Typography>

          {/* 統計情報 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '2rem',
                  letterSpacing: '-0.02em',
                }}
              >
                99%
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                リスク検出率
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '2rem',
                  letterSpacing: '-0.02em',
                }}
              >
                3分
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                平均レビュー時間
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '2rem',
                  letterSpacing: '-0.02em',
                }}
              >
                500+
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                導入企業
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
