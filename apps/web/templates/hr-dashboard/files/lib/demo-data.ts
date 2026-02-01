/* ────────────────────────────────────────────
 * HR Dashboard 데모 데이터
 * ──────────────────────────────────────────── */

// ── KPI 카드 ──────────────────────────────

export interface KpiItem {
  label: string
  value: string
  change: number // 퍼센트 변화 (양수=증가, 음수=감소)
  zone: 'ingest' | 'struct' | 'graph' | 'path'
}

export const kpiResourceAllocation: KpiItem[] = [
  { label: '프로젝트 수', value: '24', change: 8.3, zone: 'ingest' },
  { label: '투입 인력', value: '186', change: 3.2, zone: 'struct' },
  { label: '평균 가동률', value: '87%', change: -1.5, zone: 'graph' },
  { label: '예산 집행률', value: '72%', change: 5.1, zone: 'path' },
]

export const kpiTalentInfo: KpiItem[] = [
  { label: '전체 인원', value: '312', change: 2.6, zone: 'ingest' },
  { label: '평균 경력', value: '6.4년', change: 0.3, zone: 'struct' },
  { label: '스킬 보유율', value: '78%', change: 4.2, zone: 'graph' },
  { label: '이직 위험', value: '12%', change: -2.1, zone: 'path' },
]

// ── 프로젝트 현황 (도넛 차트) ───────────

export interface ProjectStatus {
  label: string
  value: number
  color: string // CSS 색상
}

export const projectStatusData: ProjectStatus[] = [
  { label: '정상 진행', value: 14, color: 'hsl(142, 71%, 45%)' },
  { label: '주의 필요', value: 6, color: 'hsl(38, 92%, 50%)' },
  { label: '지연', value: 3, color: 'hsl(0, 72%, 51%)' },
  { label: '완료', value: 1, color: 'hsl(217, 91%, 60%)' },
]

// ── 인력 흐름 (바+라인 차트) ─────────────

export interface WorkforceFlowMonth {
  month: string
  inflow: number
  outflow: number
  actualHeadcount: number
  predictedHeadcount: number | null
}

export const workforceFlowData: WorkforceFlowMonth[] = [
  { month: '7월', inflow: 12, outflow: 5, actualHeadcount: 295, predictedHeadcount: null },
  { month: '8월', inflow: 8, outflow: 7, actualHeadcount: 296, predictedHeadcount: null },
  { month: '9월', inflow: 15, outflow: 4, actualHeadcount: 307, predictedHeadcount: null },
  { month: '10월', inflow: 6, outflow: 9, actualHeadcount: 304, predictedHeadcount: null },
  { month: '11월', inflow: 10, outflow: 6, actualHeadcount: 308, predictedHeadcount: null },
  { month: '12월', inflow: 5, outflow: 3, actualHeadcount: 310, predictedHeadcount: null },
  { month: '1월', inflow: 9, outflow: 7, actualHeadcount: 312, predictedHeadcount: 312 },
  { month: '2월', inflow: 0, outflow: 0, actualHeadcount: 0, predictedHeadcount: 318 },
  { month: '3월', inflow: 0, outflow: 0, actualHeadcount: 0, predictedHeadcount: 325 },
  { month: '4월', inflow: 0, outflow: 0, actualHeadcount: 0, predictedHeadcount: 330 },
]

// ── 스킬 트리맵 ──────────────────────────

export interface SkillNode {
  name: string
  value: number
  color: string
}

export const skillTreemapData: SkillNode[] = [
  { name: 'React', value: 84, color: 'hsl(217, 91%, 60%)' },
  { name: 'Python', value: 72, color: 'hsl(142, 71%, 45%)' },
  { name: 'TypeScript', value: 68, color: 'hsl(258, 90%, 66%)' },
  { name: 'AWS', value: 56, color: 'hsl(38, 92%, 50%)' },
  { name: 'Java', value: 48, color: 'hsl(0, 72%, 51%)' },
  { name: 'SQL', value: 44, color: 'hsl(188, 95%, 42%)' },
  { name: 'Docker', value: 36, color: 'hsl(217, 70%, 50%)' },
  { name: 'K8s', value: 28, color: 'hsl(258, 70%, 56%)' },
  { name: 'Go', value: 22, color: 'hsl(142, 50%, 40%)' },
  { name: 'Figma', value: 18, color: 'hsl(330, 80%, 60%)' },
]

// ── 인재 테이블 ──────────────────────────

export interface TalentRow {
  id: string
  name: string
  department: string
  role: string
  skills: string[]
  experience: number
  rating: 'S' | 'A' | 'B' | 'C'
  riskLevel: 'low' | 'mid' | 'high'
}

export const talentTableData: TalentRow[] = [
  { id: 'E001', name: '김서준', department: '개발1팀', role: 'Frontend Lead', skills: ['React', 'TypeScript'], experience: 8, rating: 'S', riskLevel: 'low' },
  { id: 'E002', name: '이하윤', department: '개발2팀', role: 'Backend Engineer', skills: ['Java', 'AWS'], experience: 5, rating: 'A', riskLevel: 'mid' },
  { id: 'E003', name: '박도현', department: 'AI팀', role: 'ML Engineer', skills: ['Python', 'Docker'], experience: 4, rating: 'A', riskLevel: 'low' },
  { id: 'E004', name: '최수아', department: '개발1팀', role: 'Full-stack', skills: ['React', 'Python'], experience: 6, rating: 'S', riskLevel: 'low' },
  { id: 'E005', name: '정유준', department: '인프라팀', role: 'DevOps', skills: ['K8s', 'AWS'], experience: 7, rating: 'A', riskLevel: 'high' },
  { id: 'E006', name: '강지아', department: 'AI팀', role: 'Data Scientist', skills: ['Python', 'SQL'], experience: 3, rating: 'B', riskLevel: 'mid' },
  { id: 'E007', name: '윤시우', department: '디자인팀', role: 'UI Designer', skills: ['Figma', 'React'], experience: 4, rating: 'A', riskLevel: 'low' },
  { id: 'E008', name: '임하린', department: '개발2팀', role: 'Backend Lead', skills: ['Go', 'Docker'], experience: 9, rating: 'S', riskLevel: 'mid' },
]

export const departments = ['전체', '개발1팀', '개발2팀', 'AI팀', '인프라팀', '디자인팀']
