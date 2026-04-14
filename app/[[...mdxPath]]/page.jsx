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
 
export default async function Page(props) {
  const params = await props.params
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode
  } = await importPage(params.mdxPath)
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}