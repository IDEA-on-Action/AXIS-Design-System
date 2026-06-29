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
    </DocPageLayout>
  )
}
