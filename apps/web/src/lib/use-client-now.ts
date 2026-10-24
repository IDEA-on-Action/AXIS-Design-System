'use client'

import { useEffect, useState } from 'react'

/**
 * 마운트한 뒤에만 현재 시각(ms)을 돌려준다(WI-0058).
 *
 * 문서 데모가 `new Date()` 를 렌더 중에 만들면 정적 빌드(서버) 시각과 브라우저 시각이 달라
 * 시각 문자열이 하이드레이션 불일치(React #418)를 낸다. 서버 렌더와 첫 클라이언트 렌더에서는
 * null 을 돌려 시각을 그리지 않고, 마운트 뒤에 한 번 채운다.
 */
export function useClientNow(): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
  }, [])
  return now
}
