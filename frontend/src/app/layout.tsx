// Root layout: intentionally renders no HTML tags
// The [locale]/layout.tsx renders the actual <html> and <body> elements.
// See: https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
