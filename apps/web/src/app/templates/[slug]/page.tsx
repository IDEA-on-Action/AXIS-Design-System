import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { notFound } from 'next/navigation'
import type { TemplateDetail } from '@/lib/template-types'
import { TemplateDetailContent } from './_components/template-detail-content'

interface Props {
  params: Promise<{ slug: string }>
}

async function getTemplate(slug: string): Promise<TemplateDetail | null> {
  try {
    const filePath = join(process.cwd(), 'public', 'templates', `${slug}.json`)
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function generateStaticParams() {
  try {
    const filePath = join(process.cwd(), 'public', 'templates', 'index.json')
    const raw = await readFile(filePath, 'utf-8')
    const index = JSON.parse(raw)
    return index.templates.map((t: { slug: string }) => ({ slug: t.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const template = await getTemplate(slug)
  if (!template) return { title: 'Template Not Found' }
  return {
    title: `${template.name} - AXIS Templates`,
    description: template.description,
  }
}

export default async function TemplateDetailPage({ params }: Props) {
  const { slug } = await params
  const template = await getTemplate(slug)
  if (!template) notFound()

  return <TemplateDetailContent template={template} />
}
