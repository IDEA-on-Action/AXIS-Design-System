'use client'

import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@axis-ds/ui-react/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@axis-ds/ui-react/table'
import { findElement, findProject, kindLabels, type OntologyElement } from '../../lib/demo-data'
import { ElementTile } from './element-tile'
import { KeyValue, Section } from './section'
import { StatusBadge } from './status-badge'

/** depth 상세 본문. 탭은 세그먼트(AXIS Tabs)이고, 각 탭 안은 절 간격 40px 로 나눕니다 */
export function ElementDetailTabs({ element }: { element: OntologyElement }) {
  const project = findProject(element.projectId)
  const related = element.relatedIds
    .map((id) => findElement(id))
    .filter((e): e is OntologyElement => e !== undefined)

  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-[18px]">
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="properties">속성 {element.properties.length}</TabsTrigger>
        <TabsTrigger value="history">기록</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        <Section title="기본 정보">
          <KeyValue
            items={[
              { label: '종류', value: kindLabels[element.kind] },
              { label: '상태', value: <StatusBadge status={element.status} /> },
              { label: '담당', value: element.owner },
              {
                label: '프로젝트',
                value: project ? (
                  <Link href={`/projects/${project.id}`} className="font-semibold text-accent-foreground hover:underline">
                    {project.name}
                  </Link>
                ) : (
                  '없음'
                ),
              },
              { label: '수정일', value: element.updatedAt },
            ]}
          />
        </Section>
        <Section title="설명">
          <p className="leading-7 text-secondary-foreground">{element.description}</p>
        </Section>
        <Section title="연결된 요소" count={related.length}>
          <ul className="flex flex-col gap-1">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/entities/${r.id}`}
                  className="flex items-center gap-2.5 rounded-sm px-2 py-2 hover:bg-muted"
                >
                  <ElementTile kind={r.kind} size="sm" />
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-[12.5px] text-muted-foreground">{kindLabels[r.kind]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </TabsContent>

      <TabsContent value="properties" className="mt-0">
        <Section title="속성" count={element.properties.length}>
          <div className="overflow-hidden rounded-sm border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead>이름</TableHead>
                  <TableHead>형식</TableHead>
                  <TableHead>필수</TableHead>
                  <TableHead>설명</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {element.properties.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-mono text-[13px]">{p.name}</TableCell>
                    <TableCell>{p.type}</TableCell>
                    <TableCell>{p.required ? '예' : '아니요'}</TableCell>
                    <TableCell>{p.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Section>
      </TabsContent>

      <TabsContent value="history" className="mt-0">
        <Section title="변경 기록" count={element.history.length}>
          <ol className="flex flex-col gap-3">
            {element.history.map((h) => (
              <li key={h.at + h.summary} className="flex gap-4 text-sm">
                <span className="w-24 shrink-0 tabular-nums text-muted-foreground">{h.at}</span>
                <span>{h.summary}</span>
              </li>
            ))}
          </ol>
        </Section>
      </TabsContent>
    </Tabs>
  )
}
