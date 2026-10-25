import { notFound } from 'next/navigation'
import { ComponentDetailContent } from './_components/component-detail-content'
import fs from 'fs'
import path from 'path'
import type { LibraryIndex } from '@/lib/library-types'

// 빌드 시 index.json 을 읽습니다. 없으면 상세 주소를 정할 수 없어 빌드를 멈춥니다(예전처럼 기본 경로로 넘어가지 않음)
function readLibraryIndex(): LibraryIndex {
  const indexPath = path.join(process.cwd(), 'public', 'library', 'index.json')
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as LibraryIndex
}

// 상세 주소는 항목마다 하나입니다(WI-0060): 같은 주소를 쓰던 외부 항목은 slug 가 `<source>-<slug>`
export async function generateStaticParams() {
  return readLibraryIndex().components.map((comp) => ({
    category: comp.category,
    slug: comp.slug,
  }))
}

interface ComponentDetailPageProps {
  params: Promise<{ category: string; slug: string }>
}

export default async function ComponentDetailPage({ params }: ComponentDetailPageProps) {
  const { category, slug } = await params
  // (category, slug) 로 항목을 골라 그 항목 id 의 상세 파일(components/<id>.json)을 읽게 합니다
  const entry = readLibraryIndex().components.find((c) => c.category === category && c.slug === slug)
  if (!entry) notFound()
  return <ComponentDetailContent category={category} id={entry.id} />
}
