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
      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-semibold text-foreground">
            {appConfig.name}
          </Link>

          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            {footerLinks.map((link, index) => (
              <span key={link.name} className="flex items-center">
                <Link
                  href={link.href}
                  className="hover:text-foreground transition-colors px-2"
                >
                  {link.name}
                </Link>
                {index < footerLinks.length - 1 && (
                  <span className="text-muted-foreground/50">·</span>
                )}
              </span>
            ))}
          </nav>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {appConfig.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
