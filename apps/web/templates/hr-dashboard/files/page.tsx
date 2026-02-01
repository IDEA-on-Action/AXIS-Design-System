'use client'

import { useState } from 'react'
import { TabNavigation, type TabId } from './components/tab-navigation'
import { KpiCardGrid } from './components/kpi-card-grid'
import { ProjectStatusChart } from './components/project-status-chart'
import { WorkforceFlowChart } from './components/workforce-flow-chart'
import { SkillTreemap } from './components/skill-treemap'
import { TalentTable } from './components/talent-table'
import {
  kpiResourceAllocation,
  kpiTalentInfo,
  projectStatusData,
  workforceFlowData,
  skillTreemapData,
  talentTableData,
} from './lib/demo-data'

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('resource')

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 헤더 */}
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">HR 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-0.5">인사 의사결정 지원 시스템</p>
      </header>

      {/* 탭 */}
      <div className="px-6 pt-4">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* 콘텐츠 */}
      <main className="p-6 space-y-6">
        {activeTab === 'resource' && (
          <>
            <KpiCardGrid items={kpiResourceAllocation} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProjectStatusChart data={projectStatusData} />
              <SkillTreemap data={skillTreemapData} />
            </div>
          </>
        )}

        {activeTab === 'talent' && (
          <>
            <KpiCardGrid items={kpiTalentInfo} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TalentTable data={talentTableData} />
              </div>
              <SkillTreemap data={skillTreemapData} />
            </div>
          </>
        )}

        {activeTab === 'forecast' && (
          <WorkforceFlowChart data={workforceFlowData} />
        )}
      </main>
    </div>
  )
}
