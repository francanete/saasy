import Link from "next/link";
import { appConfig } from "@/lib/config";
import { Twitter, Github, Linkedin } from "lucide-react";
import { PlauderaLogo } from "@/components/plaudera-logo";

const footerSections = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-border bg-background border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brand Column - Takes up 2 columns on large screens */}
          <div className="space-y-8 lg:col-span-2">
            <div className="flex items-center space-x-2">
              <PlauderaLogo className="text-foreground h-8 w-8" />
              <span className="text-foreground text-xl font-bold tracking-tight">
                {appConfig.name}
              </span>
            </div>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              {appConfig.description}
              <br />
              Building the future of digital experiences with confidence and
              security.
            </p>
            <div className="flex space-x-5">
              <a
                href={appConfig.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={appConfig.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5" />
              </a>
              <a
                href={appConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-border mt-12 border-t pt-8">
          <p className="text-muted-foreground text-center text-sm md:text-left">
            &copy; {new Date().getFullYear()} {appConfig.name}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
