'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@ax/ui'
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqItems: FAQItem[] = [
  {
    category: '기본 개념',
    question: 'Activity와 Signal의 차이점은 무엇인가요?',
    answer: 'Activity는 외부에서 수집한 정보의 원본 단위입니다 (예: 세미나 정보, 뉴스 기사). Signal은 Activity를 분석하여 추출한 사업 기회의 단서입니다. 하나의 Activity에서 여러 Signal이 추출될 수 있습니다.',
  },
  {
    category: '기본 개념',
    question: 'Scorecard 점수는 어떻게 계산되나요?',
    answer: 'Scorecard는 5가지 차원(Market Size, Fit, Timing, Competition, Feasibility)에서 각각 0-20점으로 평가됩니다. 총점 100점 만점이며, 75점 이상은 GO, 50-74점은 PIVOT, 25-49점은 HOLD, 24점 이하는 NO_GO로 판정됩니다.',
  },
  {
    category: '기본 개념',
    question: 'Brief는 언제 생성되나요?',
    answer: 'Scorecard에서 GO 판정(75점 이상)을 받은 Signal에 대해 자동으로 1-Page Brief가 생성됩니다. /ax:brief 명령으로 수동 생성도 가능합니다.',
  },
  {
    category: '워크플로',
    question: '워크플로는 자동으로 실행되나요?',
    answer: '기본적으로 각 워크플로는 이전 단계 완료 시 자동으로 트리거됩니다. 하지만 /ax:triage, /ax:brief 등의 명령으로 특정 단계를 수동 실행할 수도 있습니다.',
  },
  {
    category: '워크플로',
    question: 'Activity 수집 소스는 어떻게 설정하나요?',
    answer: 'external_scout 에이전트 설정에서 RSS 피드, 웹사이트, API 엔드포인트 등을 구성할 수 있습니다. 현재는 데스크리서치(웹), 자사활동(내부 시스템), 영업PM(수동 입력) 채널을 지원합니다.',
  },
  {
    category: '워크플로',
    question: 'Signal 중복은 어떻게 처리되나요?',
    answer: 'voc_analyst 에이전트가 자동으로 유사 Signal을 탐지하고 병합합니다. 수동으로 병합하려면 Signal 관리 화면에서 여러 Signal을 선택 후 병합 버튼을 클릭하세요.',
  },
  {
    category: 'Confluence 연동',
    question: 'Confluence 페이지는 어디에 생성되나요?',
    answer: 'Brief는 설정된 Confluence Space의 Play DB 하위에 생성됩니다. Space ID와 Parent Page ID는 환경 변수 또는 설정 파일에서 구성합니다.',
  },
  {
    category: 'Confluence 연동',
    question: 'Confluence 동기화가 실패하면 어떻게 하나요?',
    answer: '/ax:confluence status로 상태를 확인하고, /ax:confluence sync로 재동기화를 시도하세요. 지속적인 실패 시 Confluence API 토큰 및 권한을 확인하세요.',
  },
  {
    category: 'CLI 사용',
    question: 'CLI 명령어 목록을 확인하려면?',
    answer: 'Claude Code에서 /help를 입력하면 사용 가능한 모든 명령어 목록을 확인할 수 있습니다. 각 명령어에 대한 상세 설명은 /ax:[command] --help로 확인하세요.',
  },
  {
    category: 'CLI 사용',
    question: '에이전트 실행 결과는 어디서 확인하나요?',
    answer: 'CLI에서 실시간으로 결과가 출력됩니다. 상세 로그는 .claude/logs 디렉토리에 저장되며, Web UI의 대시보드에서도 실행 이력을 확인할 수 있습니다.',
  },
  {
    category: '트러블슈팅',
    question: 'Signal 추출이 되지 않아요.',
    answer: 'Activity의 컨텐츠가 충분한지 확인하세요. 너무 짧거나 비구조화된 텍스트는 Signal 추출이 어려울 수 있습니다. 필요시 Activity 상세 정보를 수동으로 보완하세요.',
  },
  {
    category: '트러블슈팅',
    question: 'Scorecard 점수가 예상과 다릅니다.',
    answer: 'scorecard_evaluator는 Signal 컨텍스트와 시장 데이터를 기반으로 평가합니다. 수동으로 점수를 조정하려면 Scorecard 상세 화면에서 각 차원별 점수를 수정할 수 있습니다.',
  },
]

const categories = [...new Set(faqItems.map((item) => item.category))]

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium pr-4">{item.question}</span>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all',
          isOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="p-4 pt-0 text-sm text-muted-foreground">
          {item.answer}
        </div>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Badge variant="secondary">FAQ</Badge>
        <h1 className="text-4xl font-bold tracking-tight">자주 묻는 질문</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AX Discovery Portal 사용 중 자주 묻는 질문과 답변입니다.
        </p>
      </div>

      {/* FAQ by Category */}
      {categories.map((category) => {
        const categoryItems = faqItems.filter((item) => item.category === category)
        const startIndex = faqItems.findIndex((item) => item.category === category)

        return (
          <section key={category} className="space-y-4">
            <h2 className="text-2xl font-semibold">{category}</h2>
            <div className="space-y-2">
              {categoryItems.map((item, idx) => {
                const globalIndex = startIndex + idx
                return (
                  <AccordionItem
                    key={globalIndex}
                    item={item}
                    isOpen={openItems.has(globalIndex)}
                    onToggle={() => toggleItem(globalIndex)}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">추가 문의</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              도움이 필요하신가요?
            </CardTitle>
            <CardDescription>
              FAQ에서 답을 찾지 못하셨다면 아래 방법으로 문의하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Slack: #ax-discovery-support 채널</p>
            <p>• Email: ax-support@kt.com</p>
            <p>• GitHub Issues: 버그 리포트 및 기능 제안</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
