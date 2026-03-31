"use client"

import posthog from "posthog-js";

export function TrackedLink({ href, children, ...props }) {
  function handleClick() {
    const isDashboard =
      href && href.includes("dashboard.faable.com");

    if (isDashboard) {
      posthog.capture("dashboard_cta_clicked", {
        href,
        link_text: typeof children === "string" ? children : undefined,
      });
    } else {
      posthog.capture("doc_link_clicked", {
        href,
        link_text: typeof children === "string" ? children : undefined,
        is_external: href ? href.startsWith("http") : false,
      });
    }
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}