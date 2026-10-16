import type { Metadata, Viewport } from 'next'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
// WI-0025: AXIS 토큰 변수(--axis-*)를 globals.css(shadcn 변수)보다 먼저 로드한다.
// 브랜드 CSS를 추가할 때는 globals.css 뒤에 import 한다(명시도가 같은 :root 정의를 이겨야 함).
import '@axis-ds/tokens/css'
import './globals.css'
import { Providers } from './providers'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'AXIS Design System',
  description: 'AI/LLM 애플리케이션을 위한 React 컴포넌트 라이브러리',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AXIS DS',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}
