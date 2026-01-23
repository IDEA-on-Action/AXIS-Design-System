import { ComponentDetailContent } from './_components/component-detail-content'
import fs from 'fs'
import path from 'path'

// 빌드 시 index.json에서 컴포넌트 경로 생성
export async function generateStaticParams() {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'library', 'index.json')
    const indexContent = fs.readFileSync(indexPath, 'utf-8')
    const index = JSON.parse(indexContent)

    return index.components.map((comp: { category: string; slug: string }) => ({
      category: comp.category,
      slug: comp.slug,
    }))
  } catch {
    // Fallback: 파일이 없으면 기본 경로 사용
    console.warn('index.json을 찾을 수 없어 기본 경로를 사용합니다.')
    return [
      { category: 'ui', slug: 'button' },
      { category: 'ui', slug: 'card' },
      { category: 'agentic', slug: 'streaming-text' },
    ]
  }
}

interface ComponentDetailPageProps {
  params: Promise<{ category: string; slug: string }>
}

export default async function ComponentDetailPage({ params }: ComponentDetailPageProps) {
  const { category, slug } = await params
  return <ComponentDetailContent category={category} slug={slug} />
}
