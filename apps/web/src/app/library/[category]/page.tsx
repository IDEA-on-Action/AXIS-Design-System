import { CategoryContent } from './_components/category-content'
import fs from 'fs'
import path from 'path'

// 빌드 시 index.json에서 카테고리 경로 생성
export async function generateStaticParams() {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'library', 'index.json')
    const indexContent = fs.readFileSync(indexPath, 'utf-8')
    const index = JSON.parse(indexContent)

    return index.categories.map((cat: { id: string }) => ({
      category: cat.id,
    }))
  } catch {
    // Fallback: 파일이 없으면 기본 카테고리 사용
    console.warn('index.json을 찾을 수 없어 기본 카테고리를 사용합니다.')
    return [
      'ui',
      'agentic',
      'form',
      'layout',
      'navigation',
      'feedback',
      'overlay',
      'data-display',
      'chart',
      'utility',
    ].map((category) => ({ category }))
  }
}

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params
  return <CategoryContent category={category} />
}
