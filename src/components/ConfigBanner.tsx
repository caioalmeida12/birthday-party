import { isSupabaseConfigured } from '../lib/supabase'

export function ConfigBanner() {
  if (isSupabaseConfigured) return null

  return (
    <aside className="config-banner" role="status">
      Configure o Supabase: copie <code>.env.example</code> para <code>.env</code> e
      rode o SQL em <code>supabase/schema.sql</code>.
    </aside>
  )
}
