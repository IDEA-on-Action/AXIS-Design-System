interface PropDef {
  name: string
  type: string
  default?: string
  description: string
  required?: boolean
}

interface PropsTableProps {
  props: PropDef[]
}

export function PropsTable({ props }: PropsTableProps) {
  return (
    <>
      {/* 데스크톱 테이블 */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Prop</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Default</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {props.map((prop) => (
              <tr key={prop.name} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-medium">
                      {prop.name}
                    </code>
                    {prop.required && (
                      <span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                        Required
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-muted/70 px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                    {prop.type}
                  </code>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                  {prop.default || '-'}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {prop.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드형 */}
      <div className="sm:hidden space-y-3">
        {props.map((prop) => (
          <div key={prop.name} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-medium">
                {prop.name}
              </code>
              {prop.required && (
                <span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                  Required
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Type:</span>
              <code className="rounded bg-muted/70 px-1.5 py-0.5 font-mono text-muted-foreground">
                {prop.type}
              </code>
            </div>
            {prop.default && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Default:</span>
                <code className="font-mono text-muted-foreground">{prop.default}</code>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{prop.description}</p>
          </div>
        ))}
      </div>
    </>
  )
}
