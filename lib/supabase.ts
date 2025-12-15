import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// クライアントサイド用（匿名キー）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サーバーサイド用（サービスロールキー - 管理者権限）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Storage バケット名
export const CONTRACTS_BUCKET = 'contracts';
