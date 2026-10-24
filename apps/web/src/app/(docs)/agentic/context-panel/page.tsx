'use client'

import { ContextPanel } from '@axis-ds/agentic-ui'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const contextPanelProps = [
  { name: 'modelInfo', type: 'ModelInfo', default: '-', description: '모델 정보 객체' },
  { name: 'systemPrompt', type: 'string', default: '-', description: '시스템 프롬프트' },
  { name: 'attachedFiles', type: 'string[]', default: '-', description: '첨부 파일 경로 배열' },
  { name: 'settings', type: 'Record<string, string>', default: '-', description: '설정 키-값 쌍' },
  { name: 'collapsible', type: 'boolean', default: 'true', description: '접기/펼치기 가능 여부' },
  { name: 'defaultExpanded', type: 'boolean', default: 'false', description: '기본 펼침 상태' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const modelInfoProps = [
  { name: 'name', type: 'string', required: true, description: '모델 이름' },
  { name: 'provider', type: 'string', default: '-', description: '모델 제공자' },
  { name: 'version', type: 'string', default: '-', description: '모델 버전' },
]

const basicExample = `import { ContextPanel } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <ContextPanel
      modelInfo={{ name: 'GPT-4o', provider: 'OpenAI', version: '2024-05' }}
      systemPrompt="당신은 유능한 AI 어시스턴트입니다."
      attachedFiles={['data.csv', 'report.pdf']}
      settings={{ temperature: '0.7', maxTokens: '4096' }}
    />
  )
}`

export default function ContextPanelPage() {
  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="ContextPanel"
      description="AI 대화의 컨텍스트 정보(모델, 프롬프트, 파일, 설정)를 표시하는 접이식 패널입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx @axis-ds/cli add context-panel --agentic" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            패널 헤더를 클릭하여 접기/펼치기를 시도해 보세요.
          </p>
          <ContextPanel
            modelInfo={{ name: 'Claude 3.5 Sonnet', provider: 'Anthropic', version: '2024-10' }}
            systemPrompt="당신은 소프트웨어 아키텍트입니다. 코드 리뷰와 설계 조언을 제공합니다."
            attachedFiles={['architecture.md', 'diagram.png', 'requirements.pdf']}
            settings={{ temperature: '0.3', maxTokens: '8192', topP: '0.9' }}
            defaultExpanded
          />
        </div>
      </DocSection>

      <DocSection title="Variants">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Collapsible (기본)</p>
            <ContextPanel
              modelInfo={{ name: 'GPT-4o', provider: 'OpenAI' }}
              settings={{ temperature: '0.7' }}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Non-collapsible</p>
            <ContextPanel
              modelInfo={{ name: 'GPT-4o', provider: 'OpenAI' }}
              systemPrompt="간결하게 답변하세요."
              collapsible={false}
            />
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={contextPanelProps} />
      </DocSection>

      <DocSection title="ModelInfo Type">
        <PropsTable props={modelInfoProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'확장 가능한 영역이 aria-expanded와 aria-controls로 상태·대상을 전달합니다.'}
        </p>
        <KeyboardTable
          keys={[{ key: 'Enter / Space', description: '패널을 펼치거나 접습니다.' }]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'펼침/접힘 상태가 보조기술에 전달됩니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
