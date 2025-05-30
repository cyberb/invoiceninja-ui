/// <reference types="vite/client" />

interface ImportMetaEnv extends Readonly<Record<string, string>> {
  readonly VITE_API_URL: string;
  readonly VITE_IS_HOSTED: string;
  readonly VITE_ROUTER: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_MICROSOFT_CLIENT_ID: string;
  readonly VITE_DEMO_ENDPOINT: string;
  readonly VITE_DEMO_EMAIL: string;
  readonly VITE_DEMO_PASSWORD: string;
  readonly VITE_IS_PRODUCTION: string;
  readonly VITE_WHITELABEL_INVOICE_URL: string;
  readonly VITE_PUSHER_APP_KEY: string;
  readonly VITE_HOSTED_STRIPE_PK: string;
  readonly VITE_ENABLE_PEPPOL_STANDARD: string;
  readonly VITE_ENABLE_NEW_ACCOUNT_MANAGEMENT: string;
  readonly VITE_ENABLE_APPLE_LOGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
