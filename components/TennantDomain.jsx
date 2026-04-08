export function TennantDomain({ url = "", domainOnly = false }) {
  if (domainOnly) {
    return <>your-domain.auth.faable.link</>;
  }
  return <>https://your-domain.auth.faable.link{url}</>;
}
