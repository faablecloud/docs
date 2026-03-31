import '../globals.css'

import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import Image from 'next/image'
 
export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
    icons: {
      icon: [
          {
              url: "https://faable.com/assets/logo/Emblem.png", // /public path
              href: "https://faable.com/assets/logo/Emblem.png", // /public path
          },
      ],
    },
}
 
const banner = <Banner storageKey="some-key">Nextra 4.0 is released 🎉</Banner>
const navbar = (
  <Navbar
    logo={<div className='flex gap-4'><img src="https://faable.com/assets/logo/Emblem.png" width="35"/><p className='font-bold text-2xl'>Faable Docs</p></div>}
    // ... Your additional navbar options
  ></Navbar>
)
const footer = <Footer>{new Date().getFullYear()} © Faable Cloud.</Footer>
 
export default async function RootLayout({ children }) {
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head
      
      >
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body>
        <Layout
          // banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/faablecloud/docs"
          footer={footer}
          // ... Your additional layout options
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
