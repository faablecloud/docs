import Link from "next/link";

export const metadata = {
  title: "Page not found",
  description:
    "We couldn't find the page you were looking for. Head over to Faable Auth or Faable Deploy to keep exploring.",
};

const products = [
  {
    href: "/auth/get-started",
    emoji: "🔐",
    name: "Faable Auth",
    tagline: "Scalable, multi-tenant identity",
    description:
      "OAuth 2.0, OpenID Connect, passwordless, social login, MFA and enterprise SSO — everything you need to authenticate users.",
    cta: "Explore Auth",
  },
  {
    href: "/deploy/get-started",
    emoji: "🚀",
    name: "Faable Deploy",
    tagline: "Zero-config CI/CD",
    description:
      "Link a Git repository and Faable builds, deploys, and serves it on a global edge — with custom domains and free SSL out of the box.",
    cta: "Explore Deploy",
  },
];

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center">
      <p className="text-7xl font-black tracking-tight text-gray-300 dark:text-gray-700 sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        We couldn't find that page
      </h1>
      <p className="mt-3 max-w-xl text-base text-gray-600 dark:text-gray-400">
        The link you followed may be broken, or the page may have moved. Pick
        a product below to keep exploring — or jump back to the{" "}
        <Link href="/" className="font-medium underline underline-offset-4">
          docs home
        </Link>
        .
      </p>

      <div className="mt-12 grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
        {products.map((product) => (
          <Link
            key={product.href}
            href={product.href}
            className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 text-left transition hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">
                {product.emoji}
              </span>
              <div>
                <h2 className="text-lg font-semibold">{product.name}</h2>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {product.tagline}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {product.description}
            </p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-gray-900 group-hover:gap-2 dark:text-gray-100">
              {product.cta}
              <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/platform/pricing" className="hover:underline">
          Pricing
        </Link>
        <span aria-hidden>·</span>
        <a
          href="https://dashboard.faable.com"
          target="_blank"
          rel="noopener"
          className="hover:underline"
        >
          Dashboard
        </a>
        <span aria-hidden>·</span>
        <a
          href="https://github.com/orgs/faablecloud/discussions"
          target="_blank"
          rel="noopener"
          className="hover:underline"
        >
          Community support
        </a>
      </div>
    </div>
  );
}
