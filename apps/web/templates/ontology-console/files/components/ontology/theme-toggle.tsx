'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@axis-ds/ui-react/button'
import { useTheme } from '@axis-ds/theme'

/** 라이트 · 다크 전환. 브랜드(ontology)는 그대로 두고 화면 모드만 바꿉니다 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // 서버 HTML 과 첫 렌더 문구를 맞추려고 마운트 뒤에만 현재 모드를 읽습니다
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={dark}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="w-full justify-start gap-2"
    >
      {dark ? <Moon aria-hidden className="size-4" /> : <Sun aria-hidden className="size-4" />}
      다크 모드
    </Button>
  )
}
