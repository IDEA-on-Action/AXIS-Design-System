'use client'

import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const tableProps = [
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
  { name: 'children', type: 'React.ReactNode', default: '-', description: '테이블 내용' },
]

const basicExample = `import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <Table>
      <TableCaption>최근 주문 목록</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">주문번호</TableHead>
          <TableHead>상품명</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">금액</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">ORD001</TableCell>
          <TableCell>디자인 시스템 라이선스</TableCell>
          <TableCell>완료</TableCell>
          <TableCell className="text-right">₩250,000</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">ORD002</TableCell>
          <TableCell>컴포넌트 패키지</TableCell>
          <TableCell>처리중</TableCell>
          <TableCell className="text-right">₩150,000</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>합계</TableCell>
          <TableCell className="text-right">₩400,000</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}`

export default function TablePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Table</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Table</h1>
          <p className="text-lg text-muted-foreground">
            데이터를 행과 열로 표시하는 테이블 컴포넌트입니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add table" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Table>
              <TableCaption>최근 주문 목록</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">주문번호</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">ORD001</TableCell>
                  <TableCell>디자인 시스템 라이선스</TableCell>
                  <TableCell>완료</TableCell>
                  <TableCell className="text-right">&#8361;250,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ORD002</TableCell>
                  <TableCell>컴포넌트 패키지</TableCell>
                  <TableCell>처리중</TableCell>
                  <TableCell className="text-right">&#8361;150,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ORD003</TableCell>
                  <TableCell>테마 확장팩</TableCell>
                  <TableCell>배송중</TableCell>
                  <TableCell className="text-right">&#8361;80,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ORD004</TableCell>
                  <TableCell>아이콘 팩</TableCell>
                  <TableCell>완료</TableCell>
                  <TableCell className="text-right">&#8361;50,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ORD005</TableCell>
                  <TableCell>CLI 도구</TableCell>
                  <TableCell>대기</TableCell>
                  <TableCell className="text-right">&#8361;30,000</TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>합계</TableCell>
                  <TableCell className="text-right">&#8361;560,000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">Table</code>
              <p className="mt-1 text-sm text-muted-foreground">테이블 루트 컨테이너</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">TableHeader</code>
              <p className="mt-1 text-sm text-muted-foreground">테이블 헤더 영역 (thead)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">TableBody</code>
              <p className="mt-1 text-sm text-muted-foreground">테이블 본문 영역 (tbody)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">TableFooter</code>
              <p className="mt-1 text-sm text-muted-foreground">테이블 푸터 영역 (tfoot)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">TableRow</code>
              <p className="mt-1 text-sm text-muted-foreground">테이블 행 (tr)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">TableHead</code>
              <p className="mt-1 text-sm text-muted-foreground">테이블 헤더 셀 (th)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">TableCell</code>
              <p className="mt-1 text-sm text-muted-foreground">테이블 데이터 셀 (td)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">TableCaption</code>
              <p className="mt-1 text-sm text-muted-foreground">테이블 캡션</p>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={tableProps} />
        </section>
      </div>
    </div>
  )
}
