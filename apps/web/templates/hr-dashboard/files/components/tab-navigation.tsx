'use client'

import { BarChart3, Users, TrendingUp } from 'lucide-react'
import { cn } from '../lib/utils'

export type TabId = 'resource' | 'talent' | 'forecast'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'resource', label: '자원 배분', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'talent', label: '인재 정보', icon: <Users className="h-4 w-4" /> },
  { id: 'forecast', label: '인력 예측', icon: <TrendingUp className="h-4 w-4" /> },
]

interface TabNavigationProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
            activeTab === tab.id
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.icon}
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </nav>
  )
}
