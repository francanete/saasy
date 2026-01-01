import Link from "next/link";
import { appConfig } from "@/lib/config";

const footerLinks = [
  { name: "Features", href: "/#features" },
  { name: "Pricing", href: "/pricing" },
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="text-foreground font-semibold">
            {appConfig.name}
          </Link>

          <nav className="text-muted-foreground flex items-center gap-1 text-sm">
            {footerLinks.map((link, index) => (
              <span key={link.name} className="flex items-center">
                <Link
                  href={link.href}
                  className="hover:text-foreground px-2 transition-colors"
                >
                  {link.name}
                </Link>
                {index < footerLinks.length - 1 && (
                  <span className="text-muted-foreground/50">·</span>
                )}
              </span>
            ))}
          </nav>

          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {appConfig.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
