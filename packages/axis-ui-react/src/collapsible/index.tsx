import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

/** 콘텐츠를 펼치거나 접을 수 있는 접이식 루트 컴포넌트 */
const Collapsible = CollapsiblePrimitive.Root;

/** 접이식 영역의 펼침/접힘을 토글하는 트리거 */
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

/** 접이식 영역의 펼쳐지는 콘텐츠 */
const CollapsibleContent = CollapsiblePrimitive.Content;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
