/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_DEFAULT_LANGUAGE: string
  readonly more: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}