import { act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import type { ReactElement } from "react";
import { MessageBubble } from "./message-bubble";
import { StepTimeline } from "./step-timeline";

/**
 * 시각 표시 하이드레이션 (WI-0069 D5)
 *
 * 서버(TZ=UTC)에서 renderToString 한 마크업을 브라우저(TZ=Asia/Seoul) 자리에서 hydrateRoot 해
 * 하이드레이션 오류(onRecoverableError · React #418)가 없는지와 최종 표시를 본다.
 * Node 는 실행 중 process.env.TZ 를 바꾸면 Date · Intl 기본 시간대가 따라 바뀐다.
 * 이 전제가 깨지면 시험이 무의미해지므로 각 시험 앞에서 두 시간대의 결과가 다른지 먼저 확인한다(양성 대조).
 */
const ORIGINAL_TZ = process.env.TZ;
const DATE = new Date("2026-10-25T03:05:00Z"); // UTC 03:05 · 서울 12:05

afterEach(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

function localTime(tz: string, locale?: string, options?: Intl.DateTimeFormatOptions): string {
  process.env.TZ = tz;
  return DATE.toLocaleTimeString(locale, options);
}

async function serverThenHydrate(ui: ReactElement, serverTz: string, clientTz: string) {
  process.env.TZ = serverTz;
  const html = renderToString(ui);
  const container = document.createElement("div");
  // 서버가 만든 마크업(신뢰하는 입력: 이 시험의 renderToString 결과)
  container.innerHTML = html;
  document.body.appendChild(container);
  process.env.TZ = clientTz;
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(container, ui, { onRecoverableError: (e) => errors.push(e) });
  });
  const text = container.querySelector("time")?.textContent ?? null;
  act(() => root?.unmount());
  container.remove();
  return { html, errors, text };
}

const HM = { hour: "2-digit", minute: "2-digit" } as const;

describe("MessageBubble 시각 하이드레이션 (WI-0069)", () => {
  it("전제: UTC 와 Asia/Seoul 의 지역 시각 문자열이 다르다(양성 대조)", () => {
    expect(localTime("UTC", "ko-KR", HM)).not.toBe(localTime("Asia/Seoul", "ko-KR", HM));
  });

  it("timeZone 없음: 서버 HTML 에는 시각이 비어 있고, 하이드레이션 오류 없이 브라우저 시간대로 채운다", async () => {
    const expected = localTime("Asia/Seoul", "ko-KR", HM);
    const { html, errors, text } = await serverThenHydrate(
      <MessageBubble role="user" content="안녕" timestamp={DATE} />,
      "UTC",
      "Asia/Seoul",
    );
    expect(html).toContain(`dateTime="${DATE.toISOString()}"`);
    expect(html).not.toContain(localTime("UTC", "ko-KR", HM));
    expect(errors).toEqual([]);
    expect(text).toBe(expected);
  });

  it("timeZone 지정: 서버 HTML 부터 그 시간대 시각이고 하이드레이션 오류가 없다", async () => {
    const expected = DATE.toLocaleTimeString("ko-KR", { ...HM, timeZone: "Asia/Seoul" });
    const { html, errors, text } = await serverThenHydrate(
      <MessageBubble role="user" content="안녕" timestamp={DATE} timeZone="Asia/Seoul" />,
      "UTC",
      "America/New_York",
    );
    expect(html).toContain(expected);
    expect(errors).toEqual([]);
    expect(text).toBe(expected);
  });

  it("locale 과 formatTime 을 쓴다", async () => {
    const en = await serverThenHydrate(
      <MessageBubble role="user" content="hi" timestamp={DATE} locale="en-US" timeZone="UTC" />,
      "UTC",
      "Asia/Seoul",
    );
    expect(en.text).toBe(DATE.toLocaleTimeString("en-US", { ...HM, timeZone: "UTC" }));
    const custom = await serverThenHydrate(
      <MessageBubble role="user" content="hi" timestamp={DATE} formatTime={(d) => d.toISOString().slice(11, 16)} />,
      "UTC",
      "Asia/Seoul",
    );
    expect(custom.html).toContain("03:05");
    expect(custom.errors).toEqual([]);
    expect(custom.text).toBe("03:05");
  });
});

describe("StepTimeline 시각 하이드레이션 (WI-0069)", () => {
  const steps = [{ id: "1", label: "요청 수신", status: "complete" as const, timestamp: DATE }];

  it("전제: UTC 와 Asia/Seoul 의 기본 로케일 시각 문자열이 다르다(양성 대조)", () => {
    expect(localTime("UTC")).not.toBe(localTime("Asia/Seoul"));
  });

  it("locale · timeZone 없음: 하이드레이션 오류 없이 이전과 같은 기본 표시(toLocaleTimeString())로 채운다", async () => {
    const expected = localTime("Asia/Seoul");
    const { html, errors, text } = await serverThenHydrate(<StepTimeline steps={steps} />, "UTC", "Asia/Seoul");
    expect(html).not.toContain(localTime("UTC"));
    expect(errors).toEqual([]);
    expect(text).toBe(expected);
  });

  it("timeZone 만 지정: 로케일이 실행 환경에 달려 있어 여전히 하이드레이션 뒤에 채운다", async () => {
    const { html, errors, text } = await serverThenHydrate(
      <StepTimeline steps={steps} timeZone="Asia/Seoul" />,
      "UTC",
      "UTC",
    );
    expect(html).toMatch(/<time[^>]*><\/time>/);
    expect(errors).toEqual([]);
    expect(text).toBe(DATE.toLocaleTimeString(undefined, { timeZone: "Asia/Seoul" }));
  });

  it("locale · timeZone 지정: 서버 HTML 부터 표시하고 하이드레이션 오류가 없다", async () => {
    const expected = DATE.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" });
    const { html, errors, text } = await serverThenHydrate(
      <StepTimeline steps={steps} locale="ko-KR" timeZone="Asia/Seoul" />,
      "UTC",
      "America/New_York",
    );
    expect(html).toContain(expected);
    expect(errors).toEqual([]);
    expect(text).toBe(expected);
  });

  it("formatTime 을 쓴다", async () => {
    const { html, errors, text } = await serverThenHydrate(
      <StepTimeline steps={steps} formatTime={(d) => d.toISOString().slice(11, 16)} />,
      "UTC",
      "Asia/Seoul",
    );
    expect(html).toContain("03:05");
    expect(errors).toEqual([]);
    expect(text).toBe("03:05");
  });
});
