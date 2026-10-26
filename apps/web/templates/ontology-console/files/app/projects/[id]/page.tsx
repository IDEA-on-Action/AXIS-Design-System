import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@axis-ds/ui-react/table'
import { ElementTile } from '../../../components/ontology/element-tile'
import { PageFrame } from '../../../components/ontology/page-frame'
import { KeyValue, Section } from '../../../components/ontology/section'
import { SplitPane } from '../../../components/ontology/split-pane'
import { StatusBadge } from '../../../components/ontology/status-badge'
import { cn } from '../../../lib/utils'
import { findElement, findProject, kindLabels, projects, type OntologyElement } from '../../../lib/demo-data'

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }))
}

/** 프로젝트 상세 2분할: 카드 안 왼쪽 열 300px(프로젝트 목록) + 오른쪽 본문 */
export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = findProject(id)
  if (!project) notFound()

  const items = project.elementIds
    .map((eid) => findElement(eid))
    .filter((e): e is OntologyElement => e !== undefined)

  return (
    <PageFrame fill>
      <SplitPane
        left={
          <>
            <h2 className="shrink-0 px-[22px] pb-2.5 pt-[18px] text-[19px] font-extrabold tracking-tight">프로젝트</h2>
            <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-4 pb-5">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    aria-current={p.id === project.id ? 'page' : undefined}
                    className={cn(
                      'flex flex-col rounded-sm px-2.5 py-2 hover:bg-muted',
                      p.id === project.id && 'bg-accent text-accent-foreground hover:bg-accent'
                    )}
                  >
                    <span className="truncate text-[13.5px] font-semibold">{p.name}</span>
                    <span className="truncate text-[12px] text-muted-foreground">
                      요소 {p.elementIds.length}개 · {p.owner}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        }
      >
        <div className="mb-[18px] flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold leading-snug tracking-tight">
              {project.name}
              <StatusBadge status={project.status} />
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">{project.summary}</p>
          </div>
        </div>

        <Section title="기본 정보">
          <KeyValue
            items={[
              { label: '담당', value: project.owner },
              { label: '요소 수', value: `${items.length}개` },
            ]}
          />
        </Section>

        <Section title="요소" count={items.length}>
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
                {items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ElementTile kind={e.kind} size="sm" />
                        <Link href={`/entities/${e.id}`} className="font-semibold hover:underline">
                          {e.name}
                        </Link>
                      </div>
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
      </SplitPane>
    </PageFrame>
  )
}
