interface KeyBinding {
  /** 키 조합 (예: "Enter", "Space", "Esc", "↑ ↓") */
  key: string
  /** 해당 키의 동작 설명 */
  description: string
}

interface KeyboardTableProps {
  keys: KeyBinding[]
}

/**
 * 키보드 조작 표 (WI-0019).
 *
 * Accessibility 섹션에서 컴포넌트의 키보드 인터랙션을 표준 형식으로 표시한다.
 * PropsTable과 동일한 스타일 언어를 따른다.
 */
export function KeyboardTable({ keys }: KeyboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium w-40">Key</th>
            <th className="px-4 py-3 text-left font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {keys.map((k) => (
            <tr key={k.key} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <kbd className="inline-flex items-center rounded border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
                  {k.key}
                </kbd>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{k.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
