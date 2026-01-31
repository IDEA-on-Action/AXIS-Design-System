import { Sidebar } from './components/sidebar'
import { StatsCard } from './components/stats-card'

const stats = [
  { title: '총 사용자', value: '2,340', change: '+12%', trend: 'up' as const },
  { title: '활성 세션', value: '573', change: '+5%', trend: 'up' as const },
  { title: '전환율', value: '3.2%', change: '-0.4%', trend: 'down' as const },
  { title: '평균 체류 시간', value: '4m 32s', change: '+18%', trend: 'up' as const },
]

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-sm text-muted-foreground">프로젝트 현황을 확인하세요.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-4">최근 활동</h2>
          <p className="text-sm text-muted-foreground">
            여기에 차트나 테이블 등 추가 콘텐츠를 배치하세요.
          </p>
        </div>
      </main>
    </div>
  )
}
