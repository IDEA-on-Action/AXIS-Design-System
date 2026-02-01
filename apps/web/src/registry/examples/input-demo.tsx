import { Input } from '@axis-ds/ui-react'

export default function InputDemo() {
  return (
    <div className="flex flex-col gap-3 max-w-sm">
      <Input type="email" placeholder="이메일 입력" />
      <Input disabled placeholder="비활성화" />
    </div>
  )
}
