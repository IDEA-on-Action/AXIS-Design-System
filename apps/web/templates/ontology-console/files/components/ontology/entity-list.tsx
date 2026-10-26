'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@axis-ds/ui-react/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@axis-ds/ui-react/table'
import { cn } from '../../lib/utils'
import { elements, kindLabels, type ElementKind } from '../../lib/demo-data'
import { ElementTile } from './element-tile'
import { StatusBadge } from './status-badge'

const kinds: (ElementKind | 'all')[] = ['all', 'entity', 'relation', 'logic', 'action']

/** 필터 칩: 고르면 연한 키컬러 바탕 · 키컬러 테두리 */
function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center rounded-full border border-input bg-card px-3.5 text-[13px] text-foreground hover:border-foreground',
        on && 'border-primary bg-accent font-semibold text-accent-foreground hover:border-primary'
      )}
    >
      {children}
    </button>
  )
}

/**
 * 목록 도구줄(검색 + 필터 칩) + 표. 줄을 누르면 depth 상세로 이동합니다(시트로 열지 않음).
 * 키보드 사용자는 이름 칸의 링크로 같은 곳에 갑니다.
 */
export function EntityList() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<ElementKind | 'all'>('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return elements.filter(
      (e) =>
        (kind === 'all' || e.kind === kind) &&
        (q === '' || e.name.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q))
    )
  }, [query, kind])

  return (
    <>
      <div role="search" className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-[300px] max-w-full">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="요소 검색"
            placeholder="이름으로 찾기"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div role="group" aria-label="종류" className="flex flex-wrap items-center gap-2">
          {kinds.map((k) => (
            <FilterChip key={k} on={kind === k} onClick={() => setKind(k)}>
              {k === 'all' ? '전체' : kindLabels[k]}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead>이름</TableHead>
              <TableHead>종류</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>담당</TableHead>
              <TableHead className="text-right">수정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  조건에 맞는 요소가 없어요
                </TableCell>
              </TableRow>
            ) : (
              rows.map((e) => (
                <TableRow
                  key={e.id}
                  onClick={() => router.push(`/entities/${e.id}`)}
                  className="cursor-pointer hover:bg-muted"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <ElementTile kind={e.kind} size="sm" />
                      <Link
                        href={`/entities/${e.id}`}
                        onClick={(ev) => ev.stopPropagation()}
                        className="font-semibold hover:underline"
                      >
                        {e.name}
                      </Link>
                      <span className="text-[12.5px] text-muted-foreground">{e.nameEn}</span>
                    </div>
                  </TableCell>
                  <TableCell>{kindLabels[e.kind]}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell>{e.owner}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.updatedAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
