import { createClient as createBrowserClient } from '@/utils/supabase/client';

// Re-export the browser client as the default supabase instance
// for any legacy imports from '@/lib/supabase'
export const supabase = createBrowserClient();
