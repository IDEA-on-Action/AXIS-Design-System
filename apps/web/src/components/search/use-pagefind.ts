'use client'

import { useEffect, useRef, useState } from 'react'

/** 검색 결과 1건 (UI에서 사용하는 정규화된 형태) */
export interface SearchResult {
  url: string
  title: string
  excerpt: string
}

interface PagefindData {
  url: string
  meta: { title?: string }
  excerpt: string
}

interface PagefindApi {
  search: (query: string) => Promise<{ results: { data: () => Promise<PagefindData> }[] }>
}

// Pagefind 모듈은 빌드 산출물(out/pagefind/pagefind.js)이라 한 번만 로드해 캐시한다.
let pagefindPromise: Promise<PagefindApi | null> | null = null

async function loadPagefind(): Promise<PagefindApi | null> {
  if (!pagefindPromise) {
    pagefindPromise = (async () => {
      try {
        // 빌드 후 정적 서빙되는 경로. 번들러가 해석하지 않도록 webpackIgnore.
        // @ts-expect-error - 런타임 전용 경로라 타입 정의 없음
        const mod = await import(/* webpackIgnore: true */ '/pagefind/pagefind.js')
        return mod as PagefindApi
      } catch {
        // dev 모드 등 pagefind 인덱스 미생성 시
        return null
      }
    })()
  }
  return pagefindPromise
}

interface UsePagefindOptions {
  limit?: number
  debounceMs?: number
}

/**
 * Pagefind 기반 문서 검색 훅 (WI-0017).
 *
 * query 변경 시 debounce 후 Pagefind 인덱스를 조회한다.
 * 인덱스가 없으면(예: dev 모드) available=false로 graceful degrade.
 */
export function usePagefind(query: string, { limit = 8, debounceMs = 150 }: UsePagefindOptions = {}) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [available, setAvailable] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const pf = await loadPagefind()
      if (!pf) {
        setAvailable(false)
        setLoading(false)
        return
      }
      try {
        const search = await pf.search(trimmed)
        const data = await Promise.all(search.results.slice(0, limit).map((r) => r.data()))
        setResults(
          data.map((d) => ({
            url: d.url,
            title: d.meta?.title ?? d.url,
            excerpt: d.excerpt,
          }))
        )
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query, limit, debounceMs])

  return { results, loading, available }
}
