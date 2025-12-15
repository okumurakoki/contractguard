import { redirect } from 'next/navigation';

export default function Home() {
  // 本番環境では認証チェックを行い、未認証の場合はランディングページを表示
  // 認証済みの場合はダッシュボードにリダイレクト
  redirect('/dashboard');
}
