import Link from 'next/link'
import { Button } from '@axis-ds/ui-react'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">페이지를 찾을 수 없습니다</h2>
      <p className="mt-2 text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/">
          <Button>
            <Home className="mr-2 h-4 w-4" />
            홈으로
          </Button>
        </Link>
        <Link href="/components">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Components
          </Button>
        </Link>
      </div>
    </div>
  )
}
