import { describe, it } from "vitest";
import { axeCheck } from "./test-utils/axe";
import {
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Checkbox,
  Switch,
  Slider,
  Toggle,
  Progress,
  Separator,
  Skeleton,
  Alert,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  RadioGroup,
  RadioGroupItem,
  Dialog,
  DialogTrigger,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./index";

// WI-0020: axe 자동 a11y 검사. 각 컴포넌트를 접근성상 유효한 최소 구성으로 렌더링한다.
describe("a11y (axe)", () => {
  it("Button", async () => {
    expect(await axeCheck(<Button>클릭</Button>)).toHaveNoViolations();
  });

  it("Badge", async () => {
    expect(await axeCheck(<Badge>New</Badge>)).toHaveNoViolations();
  });

  it("Input + Label", async () => {
    expect(
      await axeCheck(
        <>
          <Label htmlFor="name">이름</Label>
          <Input id="name" />
        </>,
      ),
    ).toHaveNoViolations();
  });

  it("Textarea + Label", async () => {
    expect(
      await axeCheck(
        <>
          <Label htmlFor="msg">메시지</Label>
          <Textarea id="msg" />
        </>,
      ),
    ).toHaveNoViolations();
  });

  it("Checkbox + Label", async () => {
    expect(
      await axeCheck(
        <div>
          <Checkbox id="agree" aria-labelledby="agree-label" />
          <Label id="agree-label" htmlFor="agree">
            동의
          </Label>
        </div>,
      ),
    ).toHaveNoViolations();
  });

  it("Switch", async () => {
    expect(await axeCheck(<Switch aria-label="알림 켜기" />)).toHaveNoViolations();
  });

  it("Slider", async () => {
    expect(
      await axeCheck(<Slider defaultValue={[50]} aria-label="볼륨" />),
    ).toHaveNoViolations();
  });

  it("Toggle", async () => {
    expect(await axeCheck(<Toggle aria-label="굵게">B</Toggle>)).toHaveNoViolations();
  });

  it("Progress", async () => {
    expect(
      await axeCheck(<Progress value={50} aria-label="로딩" />),
    ).toHaveNoViolations();
  });

  it("Separator", async () => {
    expect(await axeCheck(<Separator />)).toHaveNoViolations();
  });

  it("Skeleton", async () => {
    expect(await axeCheck(<Skeleton className="h-4 w-20" />)).toHaveNoViolations();
  });

  it("Alert", async () => {
    expect(
      await axeCheck(
        <Alert>
          <AlertTitle>주의</AlertTitle>
          <AlertDescription>설명 텍스트</AlertDescription>
        </Alert>,
      ),
    ).toHaveNoViolations();
  });

  it("Card", async () => {
    expect(
      await axeCheck(
        <Card>
          <CardHeader>
            <CardTitle>제목</CardTitle>
            <CardDescription>설명</CardDescription>
          </CardHeader>
          <CardContent>내용</CardContent>
        </Card>,
      ),
    ).toHaveNoViolations();
  });

  it("Accordion", async () => {
    expect(
      await axeCheck(
        <Accordion type="single" collapsible>
          <AccordionItem value="a">
            <AccordionTrigger>항목</AccordionTrigger>
            <AccordionContent>내용</AccordionContent>
          </AccordionItem>
        </Accordion>,
      ),
    ).toHaveNoViolations();
  });

  it("Tabs", async () => {
    expect(
      await axeCheck(
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">탭 A</TabsTrigger>
            <TabsTrigger value="b">탭 B</TabsTrigger>
          </TabsList>
          <TabsContent value="a">A 내용</TabsContent>
          <TabsContent value="b">B 내용</TabsContent>
        </Tabs>,
      ),
    ).toHaveNoViolations();
  });

  it("RadioGroup", async () => {
    expect(
      await axeCheck(
        <RadioGroup defaultValue="a" aria-label="옵션 선택">
          <div>
            <RadioGroupItem value="a" id="r-a" aria-labelledby="r-a-label" />
            <Label id="r-a-label" htmlFor="r-a">
              옵션 A
            </Label>
          </div>
          <div>
            <RadioGroupItem value="b" id="r-b" aria-labelledby="r-b-label" />
            <Label id="r-b-label" htmlFor="r-b">
              옵션 B
            </Label>
          </div>
        </RadioGroup>,
      ),
    ).toHaveNoViolations();
  });

  it("Dialog (트리거)", async () => {
    expect(
      await axeCheck(
        <Dialog>
          <DialogTrigger>열기</DialogTrigger>
        </Dialog>,
      ),
    ).toHaveNoViolations();
  });

  it("Tooltip (트리거)", async () => {
    expect(
      await axeCheck(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>도움말</TooltipTrigger>
          </Tooltip>
        </TooltipProvider>,
      ),
    ).toHaveNoViolations();
  });

  it("Table", async () => {
    expect(
      await axeCheck(
        <Table>
          <TableCaption>사용자 목록</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>역할</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>홍길동</TableCell>
              <TableCell>관리자</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      ),
    ).toHaveNoViolations();
  });

  it("Breadcrumb", async () => {
    expect(
      await axeCheck(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">홈</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>현재</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      ),
    ).toHaveNoViolations();
  });
});
