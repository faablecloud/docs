import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'
// nextra-theme-blog or your custom theme
import { PricingCta } from './components/PricingCta'
import { ProductCards } from './components/ProductBrand'
import { ScreenshotPair } from './components/ScreenshotPair'
import { TennantDomain } from './components/TennantDomain'

// Get the default MDX components
const themeComponents = getThemeComponents()

// Merge components
export function useMDXComponents(components) {
  return {
    ...themeComponents,
    ...components,
    TennantDomain,
    PricingCta,
    ProductCards,
    ScreenshotPair
  }
}
