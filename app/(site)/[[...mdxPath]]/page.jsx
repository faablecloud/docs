import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../../mdx-components'
import { datesForMdxPath } from '../../_lib/last-modified'
import { buildBreadcrumb, buildArticle, buildFaqPage } from '../../_lib/page-schema'

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

export default async function Page(props) {
  const params = await props.params
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode
  } = await importPage(params.mdxPath)

  const mdxPath = params.mdxPath ?? []
  const route = mdxPath.length ? `/${mdxPath.join('/')}` : '/'
  const { published, modified } = datesForMdxPath(mdxPath)

  // Structured data: BreadcrumbList (navigation), TechArticle (a dated,
  // attributed, citable unit), and FAQPage on pages that opt in via
  // `schema: faq` frontmatter.
  const breadcrumb = buildBreadcrumb(mdxPath, metadata?.title)
  const article = buildArticle({
    route,
    title: metadata?.title,
    description: metadata?.description,
    published,
    modified,
  })
  const faqPage = metadata?.schema === 'faq' ? buildFaqPage(route) : null
  const schemas = [breadcrumb, article, faqPage].filter(Boolean)

  const lastUpdated = modified.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
        <MDXContent {...props} params={params} />
        {mdxPath.length > 0 && (
          <p style={{ fontSize: '0.85rem', opacity: 0.55, marginTop: '3rem' }}>
            Last updated on <time dateTime={modified.toISOString()}>{lastUpdated}</time>
          </p>
        )}
      </Wrapper>
    </>
  )
}
