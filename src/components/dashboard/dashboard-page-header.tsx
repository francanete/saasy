import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionConfig = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
};

type DashboardPageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  action?: React.ReactNode | ActionConfig;
  backHref?: string;
  backLabel?: string;
};

export const headerActionClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90";

function isActionConfig(action: unknown): action is ActionConfig {
  return typeof action === "object" && action !== null && "href" in action;
}

export function DashboardPageHeader({
  title,
  subtitle,
  icon,
  iconClassName,
  action,
  backHref,
  backLabel = "Back",
}: DashboardPageHeaderProps) {
  return (
    <div>
      {backHref && (
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            {icon && <span className={cn("size-7", iconClassName)}>{icon}</span>}
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {action &&
          (isActionConfig(action) ? (
            <Button asChild>
              <Link
                href={action.href}
                {...(action.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {action.icon}
                {action.label}
              </Link>
            </Button>
          ) : (
            action
          ))}
      </div>
    </div>
  );
}
