import type { Metadata } from "next";
import { seo, getCanonicalUrl } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { appConfig } from "@/lib/config";
import Link from "next/link";

export const metadata: Metadata = seo.page({
  title: "Terms of Service",
  description: `Terms of Service for ${appConfig.name}. Read our terms and conditions.`,
  path: "/terms",
});

export default function TermsPage() {
  const { legal, name } = appConfig;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: getCanonicalUrl("/") },
          { name: "Terms of Service", url: getCanonicalUrl("/terms") },
        ]}
      />
      <div className="bg-background min-h-screen">
        <header className="border-border border-b py-12 md:py-16">
          <div className="container mx-auto max-w-3xl px-4">
            <h1 className="text-foreground text-4xl font-bold md:text-5xl">
              Terms of Service
            </h1>
            <p className="text-muted-foreground mt-4">
              Last updated: {legal.lastUpdated}
            </p>
          </div>
        </header>

        <article className="py-12 md:py-16">
          <div className="container mx-auto max-w-3xl space-y-10 px-4">
            {/* Provider */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Service Provider
              </h2>
              <p className="text-muted-foreground">
                {legal.company.name} (Company No.{" "}
                {legal.company.registrationNumber})<br />
                {legal.company.registeredAddress}
                <br />
                <Link
                  href={legal.company.contactLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Contact Us
                </Link>
              </p>
            </section>

            {/* Agreement */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Agreement
              </h2>
              <p className="text-muted-foreground">
                By using {name}, you agree to these terms. If you don&apos;t
                agree, please don&apos;t use the service. You must be at least{" "}
                {legal.terms.minimumAge} years old to use {name}.
              </p>
            </section>

            {/* The Service */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                The Service
              </h2>
              <p className="text-muted-foreground">
                {name} provides software-as-a-service functionality including
                user accounts, AI-powered features, and subscription management.
                We may modify or discontinue features with reasonable notice.
              </p>
            </section>

            {/* Accounts */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Your Account
              </h2>
              <p className="text-muted-foreground">
                You&apos;re responsible for keeping your account secure and for
                all activity under your account. Notify us immediately if you
                suspect unauthorised access.
              </p>
            </section>

            {/* Payments */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Payments
              </h2>
              <p className="text-muted-foreground">
                Paid plans are billed in advance. You can cancel anytime and
                retain access until the end of your billing period. Refunds are
                handled on a case-by-case basis.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Acceptable Use
              </h2>
              <p className="text-muted-foreground mb-3">You agree not to:</p>
              <ul className="text-muted-foreground list-disc space-y-1 pl-6">
                <li>Violate any laws or third-party rights</li>
                <li>Upload malicious code or attempt unauthorised access</li>
                <li>Interfere with or disrupt the service</li>
                <li>Use the service for illegal or harmful purposes</li>
                <li>Use AI features to generate illegal or harmful content</li>
              </ul>
            </section>

            {/* Your Content */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Your Content
              </h2>
              <p className="text-muted-foreground">
                You own your content. We only access it to provide the service.
                We don&apos;t claim ownership or use it for other purposes.
              </p>
            </section>

            {/* AI Features */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                AI Features
              </h2>
              <p className="text-muted-foreground">
                AI outputs are generated automatically and may contain errors.
                Don&apos;t rely on them for critical decisions without
                verification. Usage is subject to your plan limits.
              </p>
            </section>

            {/* Liability */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Limitation of Liability
              </h2>
              <p className="text-muted-foreground mb-3">
                To the maximum extent permitted by law, our total liability is
                limited to the fees you&apos;ve paid us in the 12 months before
                the claim, or £100, whichever is greater.
              </p>
              <p className="text-muted-foreground mb-3">
                We are not liable for indirect losses, loss of profits, or loss
                of data (except where required by data protection law).
              </p>
              <p className="text-muted-foreground">
                <strong className="font-medium">
                  Nothing limits our liability for:
                </strong>{" "}
                death or injury from our negligence, fraud, or anything that
                cannot be excluded by law.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Termination
              </h2>
              <p className="text-muted-foreground">
                You can close your account anytime. We may suspend or terminate
                accounts that violate these terms. On termination, your right to
                use the service ends immediately.
              </p>
            </section>

            {/* Law */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Governing Law
              </h2>
              <p className="text-muted-foreground">
                These terms are governed by the laws of{" "}
                {legal.terms.jurisdiction}. Disputes are subject to the
                exclusive jurisdiction of the courts of{" "}
                {legal.terms.jurisdiction}.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Changes
              </h2>
              <p className="text-muted-foreground">
                We may update these terms. Continued use after changes
                constitutes acceptance. For significant changes, we&apos;ll
                notify you by email.
              </p>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Privacy
              </h2>
              <p className="text-muted-foreground">
                Your use of {name} is also governed by our{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Severability
              </h2>
              <p className="text-muted-foreground">
                If any part of these terms is found to be unenforceable, the
                remaining provisions will continue in full force and effect.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Entire Agreement
              </h2>
              <p className="text-muted-foreground">
                These terms, together with our Privacy Policy, constitute the
                entire agreement between you and us regarding {name}.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Contact
              </h2>
              <p className="text-muted-foreground">
                Questions?{" "}
                <Link
                  href={legal.company.contactLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Contact us
                </Link>
              </p>
            </section>
          </div>
        </article>
      </div>
    </>
  );
}
