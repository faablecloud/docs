import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'
 
export const generateStaticParams = generateStaticParamsFor('mdxPath')
 
export async function generateMetadata(props, parent) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  const previousMetadata = await parent
  
  const path = params.mdxPath ? params.mdxPath.join('/') : ''
  
  return {
    ...metadata,
    alternates: {
      canonical: `https://faable.com/docs/${path}`,
    },
    openGraph: {
      ...previousMetadata.openGraph,
      ...metadata.openGraph,
      title: metadata.title,
      description: metadata.description,
      url: `https://faable.com/docs/${path}`,
    },
    twitter: {
      ...previousMetadata.twitter,
      ...metadata.twitter,
      title: metadata.title,
      description: metadata.description,
    }
  }
}
 
const Wrapper = getMDXComponents().wrapper

const SITE_URL = 'https://faable.com/docs'

// Turn a path slug ("get-started") into a readable label ("Get Started")
function humanize(slug) {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Build a schema.org BreadcrumbList from the page path. The leaf uses the real
// page title; intermediate segments are humanized from their slug.
function buildBreadcrumb(mdxPath, leafTitle) {
  const segments = mdxPath ?? []
  if (segments.length === 0) return null // homepage: a one-item breadcrumb is noise

  const items = [{ name: 'Docs', url: SITE_URL }]
  let acc = ''
  segments.forEach((segment, i) => {
    acc += `/${segment}`
    const isLast = i === segments.length - 1
    items.push({
      name: isLast && leafTitle ? leafTitle : humanize(segment),
      url: `${SITE_URL}${acc}`,
    })
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export default async function Page(props) {
  const params = await props.params
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode
  } = await importPage(params.mdxPath)
  const breadcrumb = buildBreadcrumb(params.mdxPath, metadata?.title)
  return (
    <>
      {breadcrumb && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
      )}
      <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
        <MDXContent {...props} params={params} />
      </Wrapper>
    </>
  )
}