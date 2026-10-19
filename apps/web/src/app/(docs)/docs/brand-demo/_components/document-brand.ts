'use client'

import { useEffect, useSyncExternalStore } from 'react'

/**
 * 브랜드 전환 데모의 `<html data-brand>` 읽기 · 쓰기 (WI-0025 FR-10).
 *
 * 브랜드 상태의 원본은 React state 가 아니라 `document.documentElement` 의 `data-brand` 속성 하나예요.
 * 컴포넌트는 이 속성을 구독해서 읽기만 하고, 쓰기는 사용자 클릭(setDocumentBrand)과
 * 데모 페이지 이탈(useClearBrandOnLeave) 두 곳에서만 해요. 마운트 때는 쓰지 않아요.
 * (E2E 의 applyBrand 가 로드 전에 붙인 속성을 마운트 때 지우면 ontology 조합이 기본 브랜드를 재고도
 * 통과하는 거짓 초록이 생겨요.)
 */

export const DEMO_BRANDS = ['default', 'ontology'] as const
export type DemoBrand = (typeof DEMO_BRANDS)[number]

const ATTR = 'data-brand'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] })
  return () => observer.disconnect()
}

// 속성이 없으면 기본 브랜드예요(PRD FR-10: 기본 = 속성 없음).
function getSnapshot(): string {
  return document.documentElement.getAttribute(ATTR) ?? 'default'
}

// 서버 렌더와 하이드레이션 첫 렌더는 "알 수 없음"(null)이에요. 서버 HTML 과 첫 클라이언트 렌더가 같아져
// 불일치가 없고, 하이드레이션 뒤 React 가 getSnapshot 으로 다시 렌더해 실제 속성을 읽어요.
function getServerSnapshot(): string | null {
  return null
}

/** 현재 `<html data-brand>` 값. 서버 · 하이드레이션 첫 렌더에서는 null, 속성이 없으면 'default' */
export function useDocumentBrand(): string | null {
  return useSyncExternalStore<string | null>(subscribe, getSnapshot, getServerSnapshot)
}

/** 사용자 선택으로 브랜드를 바꿔요. 기본 브랜드는 "default" 문자열을 붙이지 않고 속성을 지워요 */
export function setDocumentBrand(brand: DemoBrand): void {
  const html = document.documentElement
  if (brand === 'default') html.removeAttribute(ATTR)
  else html.setAttribute(ATTR, brand)
}

let liveMounts = 0

/**
 * 데모 페이지를 실제로 떠날 때만 `data-brand` 를 지워요(사용자 결정: 다른 문서 페이지 화면은 바뀌지 않음).
 *
 * 개발 모드 StrictMode 는 effect 를 mount -> cleanup -> mount 로 같은 커밋 안에서 동기로 다시 돌려요.
 * 다음 태스크에서 마운트 수가 아직 0 일 때만 지우므로, 개발 모드에서도 로드 전에 붙은 속성을 지우지 않아요.
 */
export function useClearBrandOnLeave(): void {
  useEffect(() => {
    liveMounts += 1
    return () => {
      liveMounts -= 1
      setTimeout(() => {
        if (liveMounts === 0) document.documentElement.removeAttribute(ATTR)
      }, 0)
    }
  }, [])
}
