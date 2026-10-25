/**
 * axe incomplete color-contrast 노드를 실패로 볼 대비 하한 (WI-0062 D2, AC2 「4.5(큰 글씨 3)」).
 *
 * 큰 글씨 판정은 axe-core 4.12 color-contrast 검사와 같은 식을 쓴다.
 * - axe 노드 data.fontSize 는 `${(px * 72 / 96).toFixed(1)}pt (${px}px)` 형식이고, fontWeight 는 'bold' 또는 'normal' 이다.
 * - ptSize = Math.ceil(px * 72) / 96, 굵게면 14pt 이상, 아니면 18pt 이상이 큰 글씨다(boldTextPt 14 · largeTextPt 18).
 * - 글자 크기를 읽지 못하면 4.5 를 쓴다(보수적인 쪽, 미측정을 큰 글씨로 풀어 주지 않는다).
 *
 * a11y.spec.ts 가 설정 단계에서 selfTest() 를 부르고, 직접 실행하면(node contrast-threshold.cjs) 같은 확인을 출력한다.
 */
const NORMAL_MIN = 4.5
const LARGE_MIN = 3

/** @param {{ fontSize?: string; fontWeight?: string } | null | undefined} data */
function isLargeText(data) {
  const m = typeof data?.fontSize === 'string' ? data.fontSize.match(/\(([\d.]+)px\)/) : null
  if (!m) return false
  const px = Number(m[1])
  if (!Number.isFinite(px) || px <= 0) return false
  const pt = Math.ceil(px * 72) / 96
  const bold = data?.fontWeight === 'bold'
  return bold ? pt >= 14 : pt >= 18
}

/** @param {{ fontSize?: string; fontWeight?: string } | null | undefined} data */
function incompleteContrastMin(data) {
  return isLargeText(data) ? LARGE_MIN : NORMAL_MIN
}

/** @param {{ contrastRatio?: number; fontSize?: string; fontWeight?: string } | null | undefined} data */
function isLowIncomplete(data) {
  const r = data?.contrastRatio
  return typeof r === 'number' && r > 0 && r < incompleteContrastMin(data)
}

/** 가짜 axe 노드 data 로 판정 함수를 확인한다. 어긋나면 throw 한다. 반환값은 확인한 경우 수다. */
function selfTest() {
  const cases = [
    // [설명, data, 기대 하한, 기대 실패 여부]
    ['보통 16px', { fontSize: '12.0pt (16px)', fontWeight: 'normal', contrastRatio: 4.4 }, 4.5, true],
    ['보통 18px(13.5pt)', { fontSize: '13.5pt (18px)', fontWeight: 'normal', contrastRatio: 3.5 }, 4.5, true],
    ['보통 24px(18pt) 큰 글씨', { fontSize: '18.0pt (24px)', fontWeight: 'normal', contrastRatio: 3.5 }, 3, false],
    ['보통 24px 큰 글씨 2.9', { fontSize: '18.0pt (24px)', fontWeight: 'normal', contrastRatio: 2.9 }, 3, true],
    ['굵게 18.6667px(14pt) 큰 글씨', { fontSize: '14.0pt (18.6667px)', fontWeight: 'bold', contrastRatio: 3.2 }, 3, false],
    // axe 는 pt 를 Math.ceil(px * 72) / 96 로 올림한다. 18.66px 은 13.995pt 지만 올림하면 14pt 라 큰 글씨다
    ['굵게 18.66px(올림 14pt) 큰 글씨', { fontSize: '14.0pt (18.66px)', fontWeight: 'bold', contrastRatio: 3.2 }, 3, false],
    ['보통 23.99px(올림 18pt) 큰 글씨', { fontSize: '18.0pt (23.99px)', fontWeight: 'normal', contrastRatio: 3.2 }, 3, false],
    ['굵게 18px(13.5pt)', { fontSize: '13.5pt (18px)', fontWeight: 'bold', contrastRatio: 3.2 }, 4.5, true],
    ['보통 18.6667px(14pt) 는 굵지 않으면 작은 글씨', { fontSize: '14.0pt (18.6667px)', fontWeight: 'normal', contrastRatio: 3.2 }, 4.5, true],
    ['글자 크기 없음', { contrastRatio: 3.2 }, 4.5, true],
    ['글자 크기 형식 다름', { fontSize: 'large', fontWeight: 'bold', contrastRatio: 3.2 }, 4.5, true],
    ['대비 수치 없음', { fontSize: '12.0pt (16px)', fontWeight: 'normal' }, 4.5, false],
    ['대비 0(바탕 미정)', { fontSize: '12.0pt (16px)', fontWeight: 'normal', contrastRatio: 0 }, 4.5, false],
    ['data 없음', null, 4.5, false],
  ]
  for (const [name, data, min, low] of cases) {
    const gotMin = incompleteContrastMin(data)
    const gotLow = isLowIncomplete(data)
    if (gotMin !== min || gotLow !== low) {
      throw new Error(`contrast-threshold 자체 확인 실패(${name}): 하한 ${gotMin}(기대 ${min}), 실패 판정 ${gotLow}(기대 ${low})`)
    }
  }
  return cases.length
}

module.exports = { incompleteContrastMin, isLowIncomplete, isLargeText, selfTest, NORMAL_MIN, LARGE_MIN }

if (require.main === module) {
  const n = selfTest()
  console.log(`contrast-threshold 자체 확인 ${n}건 통과`)
}
