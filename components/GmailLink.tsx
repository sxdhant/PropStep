"use client";

import type { ReactNode } from "react";

/**
 * An email link that opens Gmail: the Gmail app on Android and iPhone (when it is installed), Gmail in a new tab on a computer.
 * The plain mailto: link stays as the fallback (no JavaScript, or Gmail not installed on a phone).
 */
export default function GmailLink({ email, subject, className, children }: { email: string; subject?: string; className?: string; children: ReactNode }) {
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  const web = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}${subject ? `&su=${encodeURIComponent(subject)}` : ""}`;
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      e.preventDefault();
      // Android: ask for the Gmail app; its own fallback is Gmail on the web
      window.location.href = `intent:mailto:${email}${q}#Intent;scheme=mailto;package=com.google.android.gm;S.browser_fallback_url=${encodeURIComponent(web)};end`;
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      e.preventDefault();
      // iPhone: the Gmail app's own link; if it is not installed, the page stays and the standard mail link opens after a moment
      const t = window.setTimeout(() => (window.location.href = `mailto:${email}${q}`), 900);
      const cancel = () => window.clearTimeout(t);
      window.addEventListener("pagehide", cancel, { once: true });
      document.addEventListener("visibilitychange", cancel, { once: true });
      window.location.href = `googlegmail:///co?to=${encodeURIComponent(email)}${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`;
    } else {
      e.preventDefault();
      window.open(web, "_blank", "noopener");
    }
  };
  return (
    <a className={className} href={`mailto:${email}${q}`} onClick={onClick}>
      {children}
    </a>
  );
}
