'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle as CheckIcon, Error as ErrorIcon } from '@mui/icons-material';

interface InvitationData {
  email: string;
  organizationName: string;
  role: string;
  inviterName: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/invite/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || '招待の取得に失敗しました');
          return;
        }

        setInvitation(data.invitation);
      } catch {
        setError('招待の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!isSignedIn) {
      // サインインページにリダイレクト
      router.push(`/sign-in?redirect_url=/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '招待の承諾に失敗しました');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch {
      setError('招待の承諾に失敗しました');
    } finally {
      setAccepting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const roleLabel = invitation?.role === 'admin' ? '管理者' : invitation?.role === 'editor' ? '編集者' : '閲覧者';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 8 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          {success ? (
            <Box sx={{ textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                招待を承諾しました
              </Typography>
              <Typography color="text.secondary">
                ダッシュボードにリダイレクトしています...
              </Typography>
            </Box>
          ) : error && !invitation ? (
            <Box sx={{ textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                招待が見つかりません
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {error}
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/')}
                sx={{ mt: 3 }}
              >
                トップページへ
              </Button>
            </Box>
          ) : invitation ? (
            <>
              <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
                チームへの招待
              </Typography>
              <Box sx={{ my: 4, p: 3, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  組織
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {invitation.organizationName}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    権限
                  </Typography>
                  <Typography fontWeight={600}>{roleLabel}</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    招待者
                  </Typography>
                  <Typography>{invitation.inviterName}</Typography>
                </Box>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {!isSignedIn && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  招待を承諾するにはサインインが必要です
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleAccept}
                disabled={accepting}
                sx={{
                  bgcolor: '#1e40af',
                  py: 1.5,
                  '&:hover': { bgcolor: '#1e3a8a' },
                }}
              >
                {accepting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isSignedIn ? (
                  '招待を承諾する'
                ) : (
                  'サインインして承諾'
                )}
              </Button>
            </>
          ) : null}
        </Paper>
      </Container>
    </Box>
  );
}
