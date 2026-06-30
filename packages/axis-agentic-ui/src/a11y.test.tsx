import { describe, it } from "vitest";
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
