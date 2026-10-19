import type { Metadata, Viewport } from 'next'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
// WI-0025: AXIS 토큰 변수(--axis-*)를 globals.css(shadcn 변수)보다 먼저 로드한다.
// 브랜드 CSS는 globals.css 뒤에 둔다(문서 안내 순서). 라이트 선택자는 [data-brand="ontology"][data-brand="ontology"]
// 명시도 0,2,0 이라 globals.css :root(0,1,0)보다 앞에 와도 이긴다(2026-10-19 결정, 종전 0,1,0 일 때는 U11 순서 의존).
// 브랜드는 <html data-brand="ontology"> 일 때만 적용되므로 속성이 없는 기본 화면은 바뀌지 않는다(AC3).
import '@axis-ds/tokens/css'
import './globals.css'
import '@axis-ds/tokens/css/brands/ontology'
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
