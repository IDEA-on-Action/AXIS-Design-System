'use client'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const cardProps = [
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
  { name: 'children', type: 'ReactNode', required: true, description: '카드 내용' },
]

const basicExample = `import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@axis-ds/ui-react'

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  )
}`

const withFormExample = `<Card className="w-[350px]">
  <CardHeader>
    <CardTitle>Create project</CardTitle>
    <CardDescription>Deploy your new project in one-click.</CardDescription>
  </CardHeader>
  <CardContent>
    <form>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Name of your project" />
        </div>
      </div>
    </form>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancel</Button>
    <Button>Deploy</Button>
  </CardFooter>
</Card>`

export default function CardPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Card"
      description="콘텐츠를 그룹화하는 카드 컨테이너 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add card" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card Content</p>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">Card Footer</p>
            </CardFooter>
          </Card>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="With Form">
        <div className="mb-4 p-6 rounded-lg border">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Create project</CardTitle>
              <CardDescription>Deploy your new project in one-click.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="Name of your project"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Deploy</Button>
            </CardFooter>
          </Card>
        </div>
        <CodeBlock code={withFormExample} />
      </DocSection>

      <DocSection title="Components">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">Card</code>
            <p className="mt-1 text-sm text-muted-foreground">카드 컨테이너</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CardHeader</code>
            <p className="mt-1 text-sm text-muted-foreground">카드 헤더 영역</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CardTitle</code>
            <p className="mt-1 text-sm text-muted-foreground">카드 제목</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CardDescription</code>
            <p className="mt-1 text-sm text-muted-foreground">카드 설명</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CardContent</code>
            <p className="mt-1 text-sm text-muted-foreground">카드 본문</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CardFooter</code>
            <p className="mt-1 text-sm text-muted-foreground">카드 푸터</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={cardProps} />
      </DocSection>
    </DocPageLayout>
  )
}
