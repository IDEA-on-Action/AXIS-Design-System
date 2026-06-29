'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@axis-ds/ui-react'
import { usePagefind } from './use-pagefind'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 문서 사이트 검색 다이얼로그 (WI-0017).
 *
 * Pagefind 인덱스를 cmdk 기반 UI로 노출한다. Command shouldFilter=false로
 * 두어 cmdk 재필터 없이 Pagefind 랭킹을 그대로 사용한다.
 */
export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { results, loading, available } = usePagefind(query)

  function handleSelect(url: string) {
    onOpenChange(false)
    setQuery('')
    router.push(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-2xl">
        <DialogTitle className="sr-only">문서 검색</DialogTitle>
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="문서 검색... (컴포넌트, prop, 예제)"
          />
          <CommandList className="max-h-[60vh] overflow-y-auto p-2">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {!available
                ? '검색은 프로덕션 빌드에서 동작해요.'
                : loading
                  ? '검색 중...'
                  : query.trim()
                    ? '결과가 없어요.'
                    : '검색어를 입력하세요.'}
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup>
                {results.map((r) => (
                  <CommandItem
                    key={r.url}
                    value={r.url}
                    onSelect={() => handleSelect(r.url)}
                    className="flex flex-col items-start gap-1 px-3 py-2"
                  >
                    <span className="font-medium">{r.title}</span>
                    {/*
                      excerpt는 빌드 타임에 Pagefind가 리포 내 문서 콘텐츠로 생성하는 값이다.
                      사용자 입력이 인덱스에 유입되는 경로가 없고, Pagefind가 콘텐츠를 HTML-escape한 뒤
                      매치 부분만 <mark>로 감싸므로 XSS 위험이 없다 (신뢰된 빌드 산출물).
                    */}
                    <span
                      className="text-xs text-muted-foreground line-clamp-2 [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-foreground"
                      dangerouslySetInnerHTML={{ __html: r.excerpt }}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
