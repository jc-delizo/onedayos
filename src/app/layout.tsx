import type { Metadata } from 'next'
import './globals.css'
import { AppearanceProvider } from '@/components/onedayos/appearance-provider'
import { getAppearanceInitScript } from '@/components/onedayos/theme-script'
import { getDemoRuntimeConfig } from '@/kernel/env/server'

export function generateMetadata(): Metadata {
  const { demoMode } = getDemoRuntimeConfig()

  return {
    title: 'OneDayOS',
    description: 'OneDayOS platform foundation',
    robots: demoMode
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : undefined,
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getAppearanceInitScript() }} />
      </head>
      <body>
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  )
}
