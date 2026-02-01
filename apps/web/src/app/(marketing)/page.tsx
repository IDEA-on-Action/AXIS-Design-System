import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { ComponentShowcase } from '@/components/landing/component-showcase'
import { InstallCommand } from '@/components/landing/install-command'

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <InstallCommand />
      <ComponentShowcase />
      <FeaturesSection />
    </div>
  )
}
