'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'
import { KeyboardTable } from '@/components/keyboard-table'

const dialogProps = [
  { name: 'open', type: 'boolean', default: '-', description: '다이얼로그 열림 상태 (controlled)' },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    default: '-',
    description: '열림 상태 변경 콜백',
  },
  { name: 'modal', type: 'boolean', default: 'true', description: '모달 모드 여부' },
]

const basicExample = `import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            Dialog description goes here.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}`

const withFormExample = `<Dialog>
  <DialogTrigger asChild>
    <Button>Edit Profile</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input id="name" className="col-span-3" />
      </div>
    </div>
    <div className="flex justify-end">
      <Button type="submit">Save changes</Button>
    </div>
  </DialogContent>
</Dialog>`

export default function DialogPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Dialog"
      description="모달 다이얼로그 컴포넌트입니다. Radix UI Dialog 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add dialog" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>Dialog description goes here.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="With Form">
        <div className="mb-4 p-6 rounded-lg border">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>Make changes to your profile here.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name-demo" className="text-right">
                    Name
                  </Label>
                  <Input id="name-demo" className="col-span-3" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CodeBlock code={withFormExample} />
      </DocSection>

      <DocSection title="Components">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">Dialog</code>
            <p className="mt-1 text-sm text-muted-foreground">다이얼로그 루트 컨테이너</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DialogTrigger</code>
            <p className="mt-1 text-sm text-muted-foreground">다이얼로그를 여는 트리거</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DialogContent</code>
            <p className="mt-1 text-sm text-muted-foreground">다이얼로그 콘텐츠 영역</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DialogHeader</code>
            <p className="mt-1 text-sm text-muted-foreground">다이얼로그 헤더</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DialogTitle</code>
            <p className="mt-1 text-sm text-muted-foreground">다이얼로그 제목</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DialogDescription</code>
            <p className="mt-1 text-sm text-muted-foreground">다이얼로그 설명</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={dialogProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          Radix UI Dialog 기반으로 WAI-ARIA{' '}
          <a
            href="https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            Dialog (Modal) 패턴
          </a>
          을 따릅니다. 열릴 때 포커스가 다이얼로그 내부로 이동하고 갇히며(focus trap), 닫히면
          트리거로 포커스가 복원됩니다.
        </p>
        <KeyboardTable
          keys={[
            { key: 'Esc', description: '다이얼로그를 닫습니다.' },
            {
              key: 'Tab',
              description: '다이얼로그 내 포커스 가능 요소를 순환합니다 (밖으로 나가지 않음).',
            },
            { key: 'Shift + Tab', description: '역방향으로 포커스를 순환합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{'role="dialog"'}</code> +{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{'aria-modal="true"'}</code>가
            자동 적용됩니다.
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5 text-xs">DialogTitle</code>은{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">aria-labelledby</code>로
            연결되므로 필수입니다. 시각적으로 숨기려면{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">sr-only</code>를 사용하세요.
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5 text-xs">DialogDescription</code>은{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">aria-describedby</code>로
            연결됩니다.
          </li>
          <li>열린 동안 배경 콘텐츠는 비활성화되고 스크린리더에서 가려집니다.</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
