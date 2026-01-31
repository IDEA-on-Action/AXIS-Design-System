'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@axis-ds/ui-react'
import { ArrowLeft, FileCode, Package, Copy, Check, List, Code, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TemplateDetail, TemplateFile } from '@/lib/template-types'
import { templateCategories } from '@/lib/template-types'

type Tab = 'overview' | 'files' | 'setup'

export function TemplateDetailContent({ template }: { template: TemplateDetail }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const catInfo = templateCategories[template.category]

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: List },
    { id: 'files', label: 'Files', icon: Code },
    { id: 'setup', label: 'Setup', icon: BookOpen },
  ]

  return (
    <div className="container py-12">
      {/* Back link */}
      <Link
        href="/templates"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Templates
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
          <Badge variant="secondary">{catInfo?.name || template.category}</Badge>
          <Badge variant="outline">v{template.version}</Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl">{template.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab template={template} />}
      {activeTab === 'files' && <FilesTab files={template.files} />}
      {activeTab === 'setup' && <SetupTab template={template} />}
    </div>
  )
}

function OverviewTab({ template }: { template: TemplateDetail }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기능</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {template.features.map((feat) => (
              <li key={feat} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            의존성
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">dependencies</h4>
            <div className="space-y-1">
              {Object.entries(template.dependencies).map(([name, version]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <code className="text-xs">{name}</code>
                  <span className="text-xs text-muted-foreground">{version}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">devDependencies</h4>
            <div className="space-y-1">
              {Object.entries(template.devDependencies).map(([name, version]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <code className="text-xs">{name}</code>
                  <span className="text-xs text-muted-foreground">{version}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File list */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            파일 구조 ({template.files.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {template.files.map((file) => (
              <div key={file.path} className="flex items-center gap-2 text-sm py-1">
                <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <code className="text-xs">{file.path}</code>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {file.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FilesTab({ files }: { files: TemplateFile[] }) {
  const [selectedFile, setSelectedFile] = useState<string>(files[0]?.path || '')
  const currentFile = files.find((f) => f.path === selectedFile)

  return (
    <div className="flex gap-6">
      {/* File list sidebar */}
      <div className="w-60 shrink-0 space-y-1">
        {files.map((file) => (
          <button
            key={file.path}
            onClick={() => setSelectedFile(file.path)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
              selectedFile === file.path
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{file.path}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Code viewer */}
      <div className="flex-1 min-w-0">
        {currentFile && (
          <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
              <div className="flex items-center gap-2 text-sm">
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{currentFile.path}</span>
                <Badge variant="outline" className="text-[10px]">
                  {currentFile.type}
                </Badge>
              </div>
              <CopyButton text={currentFile.content} />
            </div>
            <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

function SetupTab({ template }: { template: TemplateDetail }) {
  const steps = [
    {
      title: '1. 새 프로젝트 생성',
      code: 'npx create-next-app@latest my-app',
    },
    {
      title: '2. 템플릿 파일 복사',
      description: '위 Files 탭에서 각 파일을 프로젝트에 복사합니다.',
    },
    {
      title: '3. 의존성 설치',
      code: `pnpm add ${Object.keys(template.dependencies).join(' ')}`,
    },
    {
      title: '4. 개발 서버 실행',
      code: 'pnpm dev',
    },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      {steps.map((step) => (
        <div key={step.title} className="space-y-2">
          <h3 className="text-sm font-medium">{step.title}</h3>
          {step.description && (
            <p className="text-sm text-muted-foreground">{step.description}</p>
          )}
          {step.code && (
            <div className="rounded-lg border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
                <span className="text-xs text-muted-foreground">Terminal</span>
                <CopyButton text={step.code} />
              </div>
              <pre className="p-4 text-sm">
                <code>{step.code}</code>
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? '복사됨' : '복사'}
    </button>
  )
}
