import type { Config } from 'tailwindcss'
import axisPreset from '@axis-ds/tokens/tailwind'

const config: Config = {
  presets: [axisPreset],
  content: ['./src/**/*.{ts,tsx}'],
}

export default config
