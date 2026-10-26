import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@axis-ds/ui-react/table'
import { AsideBox, PageFrame } from '../components/ontology/page-frame'
import { ElementTile } from '../components/ontology/element-tile'
import { Section } from '../components/ontology/section'
import { StatusBadge } from '../components/ontology/status-badge'
import { elements, kindLabels, projects, reviewQueue, workspace } from '../lib/demo-data'

/** 통합 뷰: 인사 · 현황 카드 · 최근 변경, 오른쪽 보조 상자(확인 필요) 420px */
export default function HomePage() {
  const recent = [...elements].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
  const kpis = [
    { label: '전체 요소', value: elements.length, note: '엔티티 · 관계 · 로직 · 액션' },
    { label: '확인 필요', value: elements.filter((e) => e.status === 'review').length, note: '검토를 기다리는 변경' },
    { label: '주의', value: elements.filter((e) => e.status === 'warning').length, note: '원천 동기화 지연 등', warn: true },
    { label: '프로젝트', value: projects.length, note: '진행 중' },
  ]

  return (
    <PageFrame
      aside={
        <AsideBox title={`확인 필요 ${reviewQueue.length}`}>
          <ul className="flex flex-col gap-1">
            {reviewQueue.map((e) => (
              <li key={e.id}>
                <Link href={`/entities/${e.id}`} className="flex items-start gap-3 rounded-sm px-2 py-2.5 hover:bg-muted">
                  <ElementTile kind={e.kind} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold">{e.name}</span>
                      <StatusBadge status={e.status} />
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">{e.history[0]?.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </AsideBox>
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">안녕하세요, 오늘 확인할 항목이 {reviewQueue.length}건 있어요</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">{workspace.name}의 온톨로지 현황이에요.</p>
      </div>

      <div className="mb-10 grid grid-cols-4 gap-4 max-[1199px]:grid-cols-2">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-0.5 rounded-sm border bg-card px-[18px] py-4">
            <span className="text-[13px] text-muted-foreground">{k.label}</span>
            <b className={k.warn ? 'mt-1 text-[26px] font-extrabold leading-tight text-destructive' : 'mt-1 text-[26px] font-extrabold leading-tight'}>
              {k.value}
            </b>
            <span className="text-[12.5px] text-muted-foreground">{k.note}</span>
          </div>
        ))}
      </div>

      <Section title="최근 변경" count={recent.length}>
        <div className="overflow-hidden rounded-sm border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>이름</TableHead>
                <TableHead>종류</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">수정일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link href={`/entities/${e.id}`} className="font-semibold hover:underline">
                      {e.name}
                    </Link>
                  </TableCell>
                  <TableCell>{kindLabels[e.kind]}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{e.updatedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>
    </PageFrame>
  )
}
