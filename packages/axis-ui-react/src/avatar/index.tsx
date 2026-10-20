/**
 * 사용자 프로필 이미지를 표시하는 아바타 컴포넌트
 * 이미지 로드 실패 시 이니셜 fallback을 표시한다.
 *
 * 이 파일은 `./avatar`(클라이언트 경계) 와 `./variants`(서버에서도 호출 가능) 를 다시 내보내는 배럴입니다.
 * 루트와 `@axis-ds/ui-react/avatar` 의 내보내기 이름은 분리 전과 같습니다(WI-0050 D2).
 * 이 파일은 클라이언트 지시문 목록(scripts/client-modules.mjs)에 넣지 않습니다. 넣으면 서버에서 `avatarVariants()` 를 부를 수 없습니다.
 */
export { Avatar, type AvatarProps } from "./avatar";
export { avatarVariants } from "./variants";
