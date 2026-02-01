export interface NavItem {
  title: string
  href: string
  disabled?: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export interface DocsConfig {
  mainNav: NavItem[]
  sidebarNav: NavGroup[]
}

export const docsConfig: DocsConfig = {
  mainNav: [
    { title: 'Docs', href: '/docs' },
    { title: 'Components', href: '/components' },
    { title: 'Agentic UI', href: '/agentic' },
    { title: 'Library', href: '/library' },
    { title: 'Templates', href: '/templates' },
  ],
  sidebarNav: [
    {
      title: 'Getting Started',
      items: [
        { title: 'Introduction', href: '/docs' },
      ],
    },
    {
      title: 'Core UI',
      items: [
        { title: 'Accordion', href: '/components/accordion' },
        { title: 'Alert', href: '/components/alert' },
        { title: 'Avatar', href: '/components/avatar' },
        { title: 'Badge', href: '/components/badge' },
        { title: 'Breadcrumb', href: '/components/breadcrumb' },
        { title: 'Button', href: '/components/button' },
        { title: 'Card', href: '/components/card' },
        { title: 'Checkbox', href: '/components/checkbox' },
        { title: 'Collapsible', href: '/components/collapsible' },
        { title: 'Command', href: '/components/command' },
        { title: 'Dialog', href: '/components/dialog' },
        { title: 'DropdownMenu', href: '/components/dropdown-menu' },
        { title: 'Input', href: '/components/input' },
        { title: 'Label', href: '/components/label' },
        { title: 'Popover', href: '/components/popover' },
        { title: 'Progress', href: '/components/progress' },
        { title: 'RadioGroup', href: '/components/radio-group' },
        { title: 'ScrollArea', href: '/components/scroll-area' },
        { title: 'Select', href: '/components/select' },
        { title: 'Separator', href: '/components/separator' },
        { title: 'Sheet', href: '/components/sheet' },
        { title: 'Skeleton', href: '/components/skeleton' },
        { title: 'Slider', href: '/components/slider' },
        { title: 'Switch', href: '/components/switch' },
        { title: 'Table', href: '/components/table' },
        { title: 'Tabs', href: '/components/tabs' },
        { title: 'Textarea', href: '/components/textarea' },
        { title: 'Toast', href: '/components/toast' },
        { title: 'Toggle', href: '/components/toggle' },
        { title: 'Tooltip', href: '/components/tooltip' },
      ],
    },
    {
      title: 'Agentic UI',
      items: [
        { title: 'AgentAvatar', href: '/agentic/agent-avatar' },
        { title: 'ApprovalDialog', href: '/agentic/approval-dialog' },
        { title: 'AttachmentCard', href: '/agentic/attachment-card' },
        { title: 'CodeBlock', href: '/agentic/code-block' },
        { title: 'ContextPanel', href: '/agentic/context-panel' },
        { title: 'DiffViewer', href: '/agentic/diff-viewer' },
        { title: 'FeedbackButtons', href: '/agentic/feedback-buttons' },
        { title: 'MessageBubble', href: '/agentic/message-bubble' },
        { title: 'PlanCard', href: '/agentic/plan-card' },
        { title: 'RecoveryBanner', href: '/agentic/recovery-banner' },
        { title: 'RunProgress', href: '/agentic/run-progress' },
        { title: 'SourcePanel', href: '/agentic/source-panel' },
        { title: 'StepTimeline', href: '/agentic/step-timeline' },
        { title: 'StreamingText', href: '/agentic/streaming-text' },
        { title: 'SurfaceRenderer', href: '/agentic/surface-renderer' },
        { title: 'ThinkingIndicator', href: '/agentic/thinking-indicator' },
        { title: 'TokenUsageIndicator', href: '/agentic/token-usage-indicator' },
        { title: 'ToolCallCard', href: '/agentic/tool-call-card' },
      ],
    },
  ],
}

/** 사이드바 네비게이션에서 현재 항목의 이전/다음 항목을 반환 */
export function getDocPagerLinks(pathname: string) {
  const allItems = docsConfig.sidebarNav.flatMap((group) => group.items)
  const currentIndex = allItems.findIndex((item) => item.href === pathname)

  if (currentIndex === -1) return { prev: null, next: null }

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null,
  }
}
