'use client'

import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

// Mock Avatar 컴포넌트 (실제는 @axis-ds/ui-react에서 import)
const Avatar = ({ src, alt, fallback, size = 'default', className = '' }: any) => {
  const sizeClasses: Record<string, string> = {
    sm: 'h-8 w-8 text-xs',
    default: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }

  const initials = fallback || (alt ? alt.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '?')

  return (
    <div className={`relative flex shrink-0 overflow-hidden rounded-full bg-muted ${sizeClasses[size]} ${className}`}>
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="aspect-square h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-medium">
          {initials}
        </span>
      )}
    </div>
  )
}

const avatarProps = [
  { name: 'src', type: 'string', default: '-', description: '이미지 소스 URL' },
  { name: 'alt', type: 'string', default: '-', description: '대체 텍스트 (이니셜 생성에도 사용)' },
  { name: 'fallback', type: 'string', default: '-', description: '이미지 로드 실패 시 표시할 텍스트' },
  { name: 'size', type: '"sm" | "default" | "lg" | "xl"', default: '"default"', description: '아바타 크기' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Avatar } from '@axis-ds/ui-react'

export function Example() {
  return (
    <Avatar
      src="https://github.com/shadcn.png"
      alt="User Name"
    />
  )
}`

const fallbackExample = `// 이미지가 없을 때 이니셜 표시
<Avatar alt="John Doe" />

// 커스텀 fallback 텍스트
<Avatar fallback="JD" />`

const sizesExample = `<Avatar size="sm" alt="SM" />
<Avatar size="default" alt="Default" />
<Avatar size="lg" alt="LG" />
<Avatar size="xl" alt="XL" />`

export default function AvatarPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Avatar</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Avatar</h1>
          <p className="text-lg text-muted-foreground">
            사용자 또는 엔티티를 나타내는 이미지/이니셜 컴포넌트입니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add avatar" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">With Image</h2>
          <div className="mb-4 flex items-center gap-4 p-6 rounded-lg border">
            <Avatar src="https://github.com/shadcn.png" alt="shadcn" />
            <Avatar src="https://github.com/vercel.png" alt="Vercel" />
            <Avatar src="https://github.com/anthropics.png" alt="Anthropic" />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Fallback</h2>
          <div className="mb-4 flex items-center gap-4 p-6 rounded-lg border">
            <Avatar alt="John Doe" />
            <Avatar alt="Alice Kim" />
            <Avatar fallback="?" />
          </div>
          <CodeBlock code={fallbackExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Sizes</h2>
          <div className="mb-4 flex items-end gap-4 p-6 rounded-lg border">
            <div className="text-center">
              <Avatar size="sm" alt="SM" />
              <p className="text-xs text-muted-foreground mt-2">sm</p>
            </div>
            <div className="text-center">
              <Avatar size="default" alt="Default" />
              <p className="text-xs text-muted-foreground mt-2">default</p>
            </div>
            <div className="text-center">
              <Avatar size="lg" alt="LG" />
              <p className="text-xs text-muted-foreground mt-2">lg</p>
            </div>
            <div className="text-center">
              <Avatar size="xl" alt="XL" />
              <p className="text-xs text-muted-foreground mt-2">xl</p>
            </div>
          </div>
          <CodeBlock code={sizesExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={avatarProps} />
        </section>
      </div>
    </div>
  )
}
