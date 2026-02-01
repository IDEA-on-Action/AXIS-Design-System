import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
} from '@axis-ds/ui-react'

export default function CardDemo() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>프로젝트 생성</CardTitle>
        <CardDescription>새 프로젝트를 생성하세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          프로젝트 이름과 설명을 입력한 후 생성 버튼을 클릭하세요.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">생성</Button>
      </CardFooter>
    </Card>
  )
}
