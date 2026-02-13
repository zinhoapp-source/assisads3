
// Manual definitions for Vite environment variables to fix missing vite/client types

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_EMAIL_SERVICE_ID: string;
  readonly VITE_EMAIL_TEMPLATE_ID: string;
  readonly VITE_EMAIL_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
