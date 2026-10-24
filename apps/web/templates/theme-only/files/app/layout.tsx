import type { Metadata } from 'next'
// AXIS 대표 글꼴 Pretendard(동적 서브셋). 글꼴 스택은 AXIS preset 이 <html> 에 적용합니다
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'AXIS Theme Only',
  description: 'AXIS 토큰 기반 테마 시스템 스타터',
}

// ontology 브랜드를 켜려면 globals.css 의 브랜드 import 주석을 풀고 <html> 에 data-brand="ontology" 를 넣습니다
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
