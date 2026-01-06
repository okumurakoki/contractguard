'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  Rating,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  VideoCall as VideoIcon,
  Chat as ChatIcon,
  Description as DocumentIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

// 弁護士の型定義
interface Lawyer {
  id: string;
  name: string;
  imageUrl: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  specializations: string[];
  lawFirm: string | null;
  prefecture: string | null;
  hourlyRate: number | null;
  consultationFee: number | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  availableTypes: string[];
  _count: {
    consultations: number;
  };
}

// 相談履歴の型定義
interface Consultation {
  id: string;
  consultationType: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  lawyer: {
    id: string;
    name: string;
    imageUrl: string | null;
    specializations: string[];
  } | null;
  contract: {
    id: string;
    contractTitle: string | null;
    contractType: string | null;
  } | null;
}

// 専門分野の選択肢
const specializationOptions = [
  '契約法',
  '労働法',
  '知的財産',
  '会社法',
  '不動産',
  '国際取引',
  'M&A',
  '紛争解決',
];

// 相談タイプのラベル
const consultationTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  chat: { label: 'チャット相談', icon: <ChatIcon /> },
  video: { label: 'ビデオ相談', icon: <VideoIcon /> },
  review: { label: '契約書レビュー', icon: <DocumentIcon /> },
};

// ステータスのラベル
const statusLabels: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
  pending: { label: '予約待ち', color: 'warning' },
  confirmed: { label: '確定', color: 'primary' },
  in_progress: { label: '進行中', color: 'primary' },
  completed: { label: '完了', color: 'success' },
  cancelled: { label: 'キャンセル', color: 'error' },
};

export default function LawyerConsultationPage() {
  const [tabValue, setTabValue] = React.useState(0);
  const [lawyers, setLawyers] = React.useState<Lawyer[]>([]);
  const [consultations, setConsultations] = React.useState<Consultation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedSpecialization, setSelectedSpecialization] = React.useState('');
  const [selectedLawyer, setSelectedLawyer] = React.useState<Lawyer | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = React.useState(false);
  const [consultationType, setConsultationType] = React.useState('');
  const [requestDetails, setRequestDetails] = React.useState('');
  const [bookingSuccess, setBookingSuccess] = React.useState(false);

  // 弁護士一覧を取得
  const fetchLawyers = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSpecialization) {
        params.set('specialization', selectedSpecialization);
      }
      const response = await fetch(`/api/lawyers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLawyers(data.lawyers);
      }
    } catch (error) {
      console.error('Failed to fetch lawyers:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSpecialization]);

  // 相談履歴を取得
  const fetchConsultations = React.useCallback(async () => {
    try {
      const response = await fetch('/api/consultations');
      if (response.ok) {
        const data = await response.json();
        setConsultations(data);
      }
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
    }
  }, []);

  React.useEffect(() => {
    fetchLawyers();
    fetchConsultations();
  }, [fetchLawyers, fetchConsultations]);

  // 予約を作成
  const handleBooking = async () => {
    if (!selectedLawyer || !consultationType) return;

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyerId: selectedLawyer.id,
          consultationType,
          requestDetails,
        }),
      });

      if (response.ok) {
        setBookingSuccess(true);
        setBookingDialogOpen(false);
        setConsultationType('');
        setRequestDetails('');
        fetchConsultations();
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  // 弁護士カードをフィルタリング
  const filteredLawyers = lawyers.filter((lawyer) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lawyer.name.toLowerCase().includes(query) ||
        lawyer.specializations.some((s) => s.toLowerCase().includes(query)) ||
        (lawyer.lawFirm?.toLowerCase().includes(query) ?? false)
      );
    }
    return true;
  });

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#1a2332' }}>
          弁護士相談
        </Typography>
        <Typography variant="body1" color="text.secondary">
          契約書のレビューや法的アドバイスについて、専門の弁護士に相談できます
        </Typography>
      </Box>

      {/* 成功メッセージ */}
      {bookingSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setBookingSuccess(false)}>
          相談予約が完了しました。弁護士からの連絡をお待ちください。
        </Alert>
      )}

      {/* タブ */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="弁護士を探す" />
          <Tab label="相談履歴" />
        </Tabs>
      </Paper>

      {/* 弁護士を探す */}
      {tabValue === 0 && (
        <>
          {/* 検索・フィルター */}
          <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="弁護士名、専門分野で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>専門分野</InputLabel>
              <Select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                label="専門分野"
              >
                <MenuItem value="">すべて</MenuItem>
                {specializationOptions.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button startIcon={<FilterIcon />} variant="outlined">
              その他のフィルター
            </Button>
          </Paper>

          {/* 弁護士一覧 */}
          {loading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 3 }}>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Skeleton variant="circular" width={80} height={80} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="60%" height={28} />
                        <Skeleton width="40%" height={20} />
                        <Skeleton width="80%" height={20} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : filteredLawyers.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                条件に一致する弁護士が見つかりませんでした
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 3 }}>
              {filteredLawyers.map((lawyer) => (
                <Card
                  key={lawyer.id}
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Avatar
                        src={lawyer.imageUrl || undefined}
                        sx={{ width: 80, height: 80, bgcolor: '#1e40af' }}
                      >
                        {lawyer.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" fontWeight={700}>
                            {lawyer.name}
                          </Typography>
                          {lawyer.isVerified && (
                            <VerifiedIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                          )}
                        </Box>
                        {lawyer.lawFirm && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <BusinessIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2">{lawyer.lawFirm}</Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Rating value={lawyer.rating} readOnly size="small" precision={0.5} />
                          <Typography variant="body2" color="text.secondary">
                            ({lawyer.reviewCount}件)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* 専門分野 */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {lawyer.specializations.slice(0, 4).map((spec) => (
                        <Chip key={spec} label={spec} size="small" variant="outlined" />
                      ))}
                      {lawyer.specializations.length > 4 && (
                        <Chip label={`+${lawyer.specializations.length - 4}`} size="small" />
                      )}
                    </Box>

                    {/* 対応可能な相談タイプ */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {lawyer.availableTypes.map((type) => {
                        const typeInfo = consultationTypeLabels[type];
                        return typeInfo ? (
                          <Chip
                            key={type}
                            icon={typeInfo.icon as React.ReactElement}
                            label={typeInfo.label}
                            size="small"
                            sx={{ bgcolor: '#f0f9ff', color: '#1e40af' }}
                          />
                        ) : null;
                      })}
                    </Box>

                    {/* 料金 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        初回相談料
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {lawyer.consultationFee
                          ? `¥${lawyer.consultationFee.toLocaleString()}`
                          : '要相談'}
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {
                        setSelectedLawyer(lawyer);
                        setBookingDialogOpen(true);
                      }}
                      sx={{
                        bgcolor: '#1e40af',
                        '&:hover': { bgcolor: '#1e3a8a' },
                      }}
                    >
                      相談を予約
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}

      {/* 相談履歴 */}
      {tabValue === 1 && (
        <Box>
          {consultations.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">相談履歴がありません</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {consultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar
                          src={consultation.lawyer?.imageUrl || undefined}
                          sx={{ width: 56, height: 56, bgcolor: '#1e40af' }}
                        >
                          {consultation.lawyer?.name.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            {consultation.lawyer?.name || '未割当'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            {consultationTypeLabels[consultation.consultationType] && (
                              <Chip
                                size="small"
                                icon={consultationTypeLabels[consultation.consultationType].icon as React.ReactElement}
                                label={consultationTypeLabels[consultation.consultationType].label}
                              />
                            )}
                            <Chip
                              size="small"
                              label={statusLabels[consultation.status]?.label || consultation.status}
                              color={statusLabels[consultation.status]?.color || 'default'}
                            />
                          </Box>
                          {consultation.scheduledAt && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, color: 'text.secondary' }}>
                              <ScheduleIcon sx={{ fontSize: 16 }} />
                              <Typography variant="body2">
                                {new Date(consultation.scheduledAt).toLocaleString('ja-JP')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <Button variant="outlined" size="small">
                        詳細
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* 予約ダイアログ */}
      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>相談を予約</DialogTitle>
        <DialogContent>
          {selectedLawyer && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Avatar
                  src={selectedLawyer.imageUrl || undefined}
                  sx={{ width: 64, height: 64, bgcolor: '#1e40af' }}
                >
                  {selectedLawyer.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {selectedLawyer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedLawyer.lawFirm}
                  </Typography>
                </Box>
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>相談タイプ</InputLabel>
                <Select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                  label="相談タイプ"
                >
                  {selectedLawyer.availableTypes.map((type) => {
                    const typeInfo = consultationTypeLabels[type];
                    return typeInfo ? (
                      <MenuItem key={type} value={type}>
                        {typeInfo.label}
                      </MenuItem>
                    ) : null;
                  })}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="相談内容"
                placeholder="相談したい内容を簡潔にお書きください"
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
              />

              {selectedLawyer.consultationFee && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  初回相談料: ¥{selectedLawyer.consultationFee.toLocaleString()}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleBooking}
            disabled={!consultationType}
            sx={{ bgcolor: '#1e40af', '&:hover': { bgcolor: '#1e3a8a' } }}
          >
            予約する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
