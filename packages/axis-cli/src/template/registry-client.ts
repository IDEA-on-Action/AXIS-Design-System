/** 템플릿 레지스트리 클라이언트 */

import fetch from "node-fetch";
import type { TemplateIndex, TemplateDetail } from "./types.js";

const TEMPLATE_REGISTRY_URL =
  process.env.AXIS_TEMPLATE_URL || "https://ds.minu.best/templates";

/**
 * 템플릿 인덱스(목록) 가져오기
 */
export async function fetchTemplateIndex(): Promise<TemplateIndex> {
  const url = `${TEMPLATE_REGISTRY_URL}/index.json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`템플릿 인덱스를 가져올 수 없습니다 (${res.status}): ${url}`);
  }

  return (await res.json()) as TemplateIndex;
}

/**
 * 특정 템플릿 상세 정보(파일 포함) 가져오기
 */
export async function fetchTemplateDetail(slug: string): Promise<TemplateDetail> {
  const url = `${TEMPLATE_REGISTRY_URL}/${slug}.json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`'${slug}' 템플릿을 찾을 수 없습니다 (${res.status}): ${url}`);
  }

  return (await res.json()) as TemplateDetail;
}
