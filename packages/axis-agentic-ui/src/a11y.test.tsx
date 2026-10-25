import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { axeCheck } from "./test-utils/axe";
import {
  AgentAvatar,
  ApprovalCard,
  AttachmentCard,
  CodeBlock,
  ContextPanel,
  DiffViewer,
  FeedbackButtons,
  MessageBubble,
  PlanCard,
  RecoveryBanner,
  RunProgress,
  SourcePanel,
  StepTimeline,
  StreamingText,
  SurfaceRenderer,
  ThinkingIndicator,
  TokenUsageIndicator,
  ToolCallCard,
} from "./index";

const noop = () => {};

// WI-0020: agentic 컴포넌트 axe 자동 a11y 검사 (실제 구현 aria 검증)
describe("a11y (axe) - agentic", () => {
  it("AgentAvatar", async () => {
    expect(await axeCheck(<AgentAvatar name="Claude" />)).toHaveNoViolations();
  });

  it("ApprovalCard", async () => {
    expect(
      await axeCheck(
        <ApprovalCard
          title="변경 사항 승인"
          actions={[
            { label: "승인", onClick: noop },
            { label: "거부", variant: "destructive", onClick: noop },
          ]}
        />,
      ),
    ).toHaveNoViolations();
  });

  it("AttachmentCard", async () => {
    expect(
      await axeCheck(<AttachmentCard type="document" name="report.pdf" />),
    ).toHaveNoViolations();
  });

  it("CodeBlock", async () => {
    expect(
      await axeCheck(<CodeBlock code="console.log('hi')" />),
    ).toHaveNoViolations();
  });

  it("ContextPanel", async () => {
    expect(await axeCheck(<ContextPanel />)).toHaveNoViolations();
  });

  it("DiffViewer", async () => {
    expect(
      await axeCheck(<DiffViewer before="const a = 1" after="const a = 2" />),
    ).toHaveNoViolations();
  });

  it("FeedbackButtons", async () => {
    expect(
      await axeCheck(<FeedbackButtons messageId="msg-1" />),
    ).toHaveNoViolations();
  });

  it("MessageBubble", async () => {
    expect(
      await axeCheck(<MessageBubble role="assistant" content="안녕하세요" />),
    ).toHaveNoViolations();
  });

  it("PlanCard", async () => {
    expect(
      await axeCheck(
        <PlanCard
          title="배포 계획"
          steps={[
            { id: "s1", label: "빌드", status: "complete" },
            { id: "s2", label: "배포", status: "running" },
          ]}
        />,
      ),
    ).toHaveNoViolations();
  });

  it("RecoveryBanner", async () => {
    expect(
      await axeCheck(<RecoveryBanner message="오류가 발생했습니다" />),
    ).toHaveNoViolations();
  });

  it("RunProgress", async () => {
    expect(
      await axeCheck(
        <RunProgress
          status="running"
          steps={[
            { id: "s1", label: "수집", status: "complete" },
            { id: "s2", label: "분석", status: "running" },
          ]}
        />,
      ),
    ).toHaveNoViolations();
  });

  it("SourcePanel", async () => {
    expect(
      await axeCheck(
        <SourcePanel
          sources={[
            { id: "src1", type: "web", title: "문서", url: "https://example.com" },
          ]}
        />,
      ),
    ).toHaveNoViolations();
  });

  it("StepTimeline", async () => {
    expect(
      await axeCheck(
        <StepTimeline
          steps={[
            { id: "s1", label: "시작", status: "complete" },
            { id: "s2", label: "진행", status: "running" },
          ]}
        />,
      ),
    ).toHaveNoViolations();
  });

  it("StreamingText", async () => {
    expect(
      await axeCheck(<StreamingText text="스트리밍 출력입니다" />),
    ).toHaveNoViolations();
  });

  it("SurfaceRenderer", async () => {
    expect(
      await axeCheck(
        <SurfaceRenderer
          surface={{ id: "sf1", type: "message", content: "메시지 내용" }}
        />,
      ),
    ).toHaveNoViolations();
  });

  it("ThinkingIndicator", async () => {
    expect(await axeCheck(<ThinkingIndicator />)).toHaveNoViolations();
  });

  it("TokenUsageIndicator", async () => {
    expect(
      await axeCheck(<TokenUsageIndicator current={1200} max={8000} />),
    ).toHaveNoViolations();
  });

  it("ToolCallCard", async () => {
    expect(
      await axeCheck(<ToolCallCard toolName="search_web" status="success" />),
    ).toHaveNoViolations();
  });
});

/**
 * WI-0069: 문서 페이지 axe(브라우저)에서 나온 비대비 결함을 그 결함을 드러내는 props 로 고정한다.
 * 위 기본 렌더는 status · onRetry · 카운트 같은 props 를 주지 않아 결함을 보지 못했다.
 * jest-axe 의 toHaveNoViolations 는 incomplete(검토 필요)를 보지 않으므로, 브라우저에서 incomplete 로만
 * 나온 규칙(DiffViewer aria-prohibited-attr · RecoveryBanner aria-valid-attr-value)은 incomplete 까지 단언한다.
 */
describe("a11y (axe) - agentic 비대비 결함 (WI-0069)", () => {
  async function ruleHits(ui: Parameters<typeof axeCheck>[0], ruleIds: string[]) {
    const r = await axeCheck(ui, { runOnly: { type: "rule", values: ruleIds } });
    return {
      violations: r.violations.flatMap((v) => v.nodes.map((n) => `${v.id} ${n.html}`)),
      incomplete: r.incomplete.flatMap((v) => v.nodes.map((n) => `${v.id} ${n.html}`)),
      // 측정 대조: 규칙이 실제로 실행됐는지(통과 · 해당 없음 포함)
      ran: [...r.passes, ...r.inapplicable, ...r.violations, ...r.incomplete].map((v) => v.id),
    };
  }

  it("MessageBubble 전송 상태 아이콘: 역할 없는 span 의 aria-label 이 없다", async () => {
    for (const status of ["sending", "sent", "error"] as const) {
      const hits = await ruleHits(
        <MessageBubble role="user" content="안녕" status={status} timestamp={new Date()} />,
        ["aria-prohibited-attr"],
      );
      expect(hits.ran).toContain("aria-prohibited-attr");
      expect(hits.violations).toEqual([]);
      expect(hits.incomplete).toEqual([]);
    }
  });

  it("DiffViewer 추가 · 삭제 줄 수: aria-prohibited-attr 위반 · incomplete 가 없고 sr-only 문장으로 읽힌다", async () => {
    const ui = <DiffViewer before={"a\nb"} after={"a\nc\nd"} filename="x.ts" />;
    const hits = await ruleHits(ui, ["aria-prohibited-attr"]);
    expect(hits.ran).toContain("aria-prohibited-attr");
    expect(hits.violations).toEqual([]);
    expect(hits.incomplete).toEqual([]);
  });

  it("RecoveryBanner description 없음 + onRetry: 없는 id 를 aria-describedby 로 가리키지 않는다", async () => {
    const hits = await ruleHits(<RecoveryBanner message="오류" onRetry={noop} onDismiss={noop} />, [
      "aria-valid-attr-value",
    ]);
    expect(hits.ran).toContain("aria-valid-attr-value");
    expect(hits.violations).toEqual([]);
    expect(hits.incomplete).toEqual([]);
  });

  it("RecoveryBanner description 있음 + onRetry: 재시도 버튼이 설명을 가리킨다", async () => {
    const { container } = render(
      <RecoveryBanner message="오류" description="네트워크 확인" onRetry={noop} />,
    );
    const retry = container.querySelector("button");
    const id = retry?.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(container.querySelector(`[id="${id}"]`)?.textContent).toBe("네트워크 확인");
  });

  it("CodeBlock 스크롤 영역: 포커스할 수 있고 이름이 있는 region 이다(jsdom 은 overflow 를 계산하지 않아 속성으로 고정)", async () => {
    const { container } = render(
      <CodeBlock code={"a\n".repeat(50)} filename="app.ts" maxHeight="120px" />,
    );
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveAttribute("aria-label", "app.ts 코드");
    expect(region).toHaveClass("overflow-auto");
    expect(await axeCheck(<CodeBlock code="x" language="ts" maxHeight="120px" />)).toHaveNoViolations();
  });
});
