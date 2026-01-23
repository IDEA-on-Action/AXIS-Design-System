// V0에서 생성된 샘플 컴포넌트
import { Button } from "@axis-ds/ui-react/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@axis-ds/ui-react/card"
import { Input } from "@axis-ds/ui-react/input"
import { Label } from "@axis-ds/ui-react/label"
import { Badge } from "@axis-ds/ui-react/badge"
import { ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function PricingCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pro Plan</CardTitle>
          <Badge variant="secondary">Popular</Badge>
        </div>
        <CardDescription>
          Perfect for growing teams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">
          $29<span className="text-sm font-normal text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Unlimited projects</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Advanced analytics</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Priority support</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
