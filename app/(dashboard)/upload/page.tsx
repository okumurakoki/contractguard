'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface UploadFile {
  file: File;
  previewUrl: string;
  contractName: string;
  contractType: string;
}

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = React.useState<UploadFile[]>([]);
  const [folderId, setFolderId] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles: UploadFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.type !== 'application/pdf') {
          setError('PDFファイルのみアップロード可能です');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('ファイルサイズは10MB以下にしてください');
          continue;
        }

        const url = URL.createObjectURL(file);
        newFiles.push({
          file,
          previewUrl: url,
          contractName: file.name.replace('.pdf', ''),
          contractType: '',
        });
      }

      setSelectedFiles([...selectedFiles, ...newFiles]);
      setError('');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles: UploadFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.type !== 'application/pdf') {
          setError('PDFファイルのみアップロード可能です');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('ファイルサイズは10MB以下にしてください');
          continue;
        }

        const url = URL.createObjectURL(file);
        newFiles.push({
          file,
          previewUrl: url,
          contractName: file.name.replace('.pdf', ''),
          contractType: '',
        });
      }

      setSelectedFiles([...selectedFiles, ...newFiles]);
      setError('');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleUpdateFileName = (index: number, name: string) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles[index].contractName = name;
    setSelectedFiles(updatedFiles);
  };

  const handleUpdateFileType = (index: number, type: string) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles[index].contractType = type;
    setSelectedFiles(updatedFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('ファイルを選択してください');
      return;
    }

    // すべてのファイルに契約書名と種類が入力されているか確認
    const missingInfo = selectedFiles.some((f) => !f.contractName || !f.contractType);
    if (missingInfo) {
      setError('すべてのファイルに契約書名と種類を入力してください');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: S3アップロード処理を実装
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        setUploadProgress(progress);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setSuccess(`${totalFiles}件の契約書のアップロードが完了しました`);

      // Clean up preview URLs
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));

      setSelectedFiles([]);
      setFolderId('');
      setUploadProgress(0);
    } catch (err) {
      setError('アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          契約書アップロード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          PDFファイルをアップロードしてAIによる自動レビューを開始
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper
        sx={{
          p: 4,
          border: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        {/* ファイルドロップエリア */}
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          sx={{
            border: '2px dashed',
            borderColor: selectedFiles.length > 0 ? 'black' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: selectedFiles.length > 0 ? 'grey.50' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'black',
              bgcolor: 'grey.50',
            },
            mb: 4,
          }}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            ファイルをドラッグ&ドロップ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            または
          </Typography>
          <Button
            variant="contained"
            component="label"
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            ファイルを選択
            <input type="file" hidden accept=".pdf" multiple onChange={handleFileSelect} />
          </Button>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
            PDFファイルのみ（最大10MB）• 複数選択可能
          </Typography>

          {selectedFiles.length > 0 && (
            <Box sx={{ mt: 3, textAlign: 'left' }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                選択されたファイル ({selectedFiles.length}件)
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {selectedFiles.map((uploadFile, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <FileIcon sx={{ fontSize: 32, color: 'black' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {uploadFile.file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleRemoveFile(index)}>
                      <CloseIcon />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* アップロード情報入力 */}
        {selectedFiles.length > 0 && (
          <Box sx={{ display: 'grid', gap: 4 }}>
            <Typography variant="h6" fontWeight={700}>
              契約書情報を入力
            </Typography>

            {selectedFiles.map((uploadFile, index) => (
              <Paper
                key={index}
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  bgcolor: 'grey.50',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`${index + 1}`}
                      sx={{
                        bgcolor: 'black',
                        color: 'white',
                        fontWeight: 700,
                        minWidth: 32,
                      }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {uploadFile.file.name}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => handleRemoveFile(index)}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    label="契約書名"
                    required
                    fullWidth
                    value={uploadFile.contractName}
                    onChange={(e) => handleUpdateFileName(index, e.target.value)}
                    placeholder="例：業務委託契約書_〇〇社"
                    size="small"
                  />

                  <FormControl fullWidth required size="small">
                    <InputLabel>契約書の種類</InputLabel>
                    <Select
                      value={uploadFile.contractType}
                      onChange={(e) => handleUpdateFileType(index, e.target.value)}
                      label="契約書の種類"
                    >
                      <MenuItem value="業務委託契約">業務委託契約</MenuItem>
                      <MenuItem value="秘密保持契約（NDA）">秘密保持契約（NDA）</MenuItem>
                      <MenuItem value="売買基本契約">売買基本契約</MenuItem>
                      <MenuItem value="賃貸借契約">賃貸借契約</MenuItem>
                      <MenuItem value="雇用契約">雇用契約</MenuItem>
                      <MenuItem value="ソフトウェア開発委託契約">ソフトウェア開発委託契約</MenuItem>
                      <MenuItem value="顧問契約">顧問契約</MenuItem>
                      <MenuItem value="代理店契約">代理店契約</MenuItem>
                      <MenuItem value="販売代理店契約">販売代理店契約</MenuItem>
                      <MenuItem value="ライセンス契約">ライセンス契約</MenuItem>
                      <MenuItem value="フランチャイズ契約">フランチャイズ契約</MenuItem>
                      <MenuItem value="M&A基本合意書">M&A基本合意書</MenuItem>
                      <MenuItem value="株式譲渡契約">株式譲渡契約</MenuItem>
                      <MenuItem value="事業譲渡契約">事業譲渡契約</MenuItem>
                      <MenuItem value="合弁契約">合弁契約</MenuItem>
                      <MenuItem value="業務提携契約">業務提携契約</MenuItem>
                      <MenuItem value="資本業務提携契約">資本業務提携契約</MenuItem>
                      <MenuItem value="OEM契約">OEM契約</MenuItem>
                      <MenuItem value="製造委託契約">製造委託契約</MenuItem>
                      <MenuItem value="物流業務委託契約">物流業務委託契約</MenuItem>
                      <MenuItem value="保守契約">保守契約</MenuItem>
                      <MenuItem value="SaaS利用規約">SaaS利用規約</MenuItem>
                      <MenuItem value="サービス利用規約">サービス利用規約</MenuItem>
                      <MenuItem value="プライバシーポリシー">プライバシーポリシー</MenuItem>
                      <MenuItem value="特定商取引法に基づく表記">特定商取引法に基づく表記</MenuItem>
                      <MenuItem value="その他">その他</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Paper>
            ))}

            <FormControl fullWidth>
              <InputLabel>フォルダ（任意）</InputLabel>
              <Select value={folderId} onChange={(e) => setFolderId(e.target.value)} label="フォルダ（任意）">
                <MenuItem value="">未分類</MenuItem>
                <MenuItem value="folder1">2024年度契約</MenuItem>
                <MenuItem value="folder2">継続契約</MenuItem>
                <MenuItem value="folder3">新規案件</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {uploading && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                アップロード中...
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {uploadProgress}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 1 }} />
          </Box>
        )}

        {/* アップロードボタン */}
        {selectedFiles.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleUpload}
              disabled={uploading}
              sx={{
                bgcolor: 'black',
                color: 'white',
                py: 1.5,
                '&:hover': { bgcolor: 'grey.800' },
                '&:disabled': { bgcolor: 'grey.300' },
              }}
            >
              {uploading ? 'アップロード中...' : `${selectedFiles.length}件の契約書をアップロードして分析開始`}
            </Button>
          </Box>
        )}
      </Paper>

      {/* PDFプレビュー */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            PDFプレビュー
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: selectedFiles.length === 1 ? '1fr' : 'repeat(2, 1fr)',
              },
              gap: 3,
            }}
          >
            {selectedFiles.map((uploadFile, index) => (
              <Paper
                key={index}
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${index + 1}`}
                      size="small"
                      sx={{ bgcolor: 'black', color: 'white', fontWeight: 700 }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {uploadFile.file.name}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: '400px',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <iframe
                    src={uploadFile.previewUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    title={`PDF Preview ${index + 1}`}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                  {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
