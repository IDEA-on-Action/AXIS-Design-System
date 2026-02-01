import { lazy, type ComponentType } from 'react'

interface ExampleEntry {
  component: React.LazyExoticComponent<ComponentType>
  code: string
}

const registry: Record<string, ExampleEntry> = {
  'button-demo': {
    component: lazy(() => import('./examples/button-demo')),
    code: `import { Button } from '@axis-ds/ui-react'

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}`,
  },
  'badge-demo': {
    component: lazy(() => import('./examples/badge-demo')),
    code: `import { Badge } from '@axis-ds/ui-react'

export default function BadgeDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  )
}`,
  },
  'input-demo': {
    component: lazy(() => import('./examples/input-demo')),
    code: `import { Input } from '@axis-ds/ui-react'

export default function InputDemo() {
  return (
    <div className="flex flex-col gap-3 max-w-sm">
      <Input type="email" placeholder="이메일 입력" />
      <Input disabled placeholder="비활성화" />
    </div>
  )
}`,
  },
  'card-demo': {
    component: lazy(() => import('./examples/card-demo')),
    code: `import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
} from '@axis-ds/ui-react'

export default function CardDemo() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>프로젝트 생성</CardTitle>
        <CardDescription>새 프로젝트를 생성하세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          프로젝트 이름과 설명을 입력한 후 생성 버튼을 클릭하세요.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">생성</Button>
      </CardFooter>
    </Card>
  )
}`,
  },
}

export function getExample(name: string): ExampleEntry | undefined {
  return registry[name]
}

export function getAllExampleNames(): string[] {
  return Object.keys(registry)
}
