import type { Metadata } from 'next'
import { ThemeProvider } from '@axis-ds/theme'
// AXIS 대표 글꼴 Pretendard(동적 서브셋). 글꼴 스택은 AXIS preset 이 <html> 에 적용합니다
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './globals.css'
import { AppShell } from '../components/ontology/app-shell'

export const metadata: Metadata = {
  title: 'Ontology Console',
  description: 'AXIS ontology 브랜드 기반 업무 콘솔',
}

/**
 * 브랜드를 두 곳에서 켭니다.
 * - <html data-brand="ontology">: 서버 HTML 부터 브랜드 색으로 그려 첫 화면이 바뀌지 않습니다
 * - ThemeProvider defaultBrand: 런타임에 setBrand · setTheme 를 쓸 수 있게 합니다(마크업이 defaultBrand 보다 앞섬, theme 1.7.0 이상)
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-brand="ontology" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider defaultTheme="light" defaultBrand="ontology">
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
