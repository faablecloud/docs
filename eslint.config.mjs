import next from 'eslint-config-next'
import prettier from 'eslint-config-prettier'

// eslint-config-next ships a native flat config (ESLint 9), so we spread it
// directly — no FlatCompat bridge needed. `prettier` goes last to switch off
// every stylistic rule that would fight the formatter; Prettier owns layout.
const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'public/_pagefind/**']
  },
  ...next,
  prettier,
  {
    // Nextra navigation files export an anonymous config object by design.
    files: ['**/_meta.ts', '**/_meta.tsx', 'mdx-components.js'],
    rules: {
      'import/no-anonymous-default-export': 'off'
    }
  }
]

export default config
