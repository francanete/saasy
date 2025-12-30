import Link from "next/link";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";

interface TrialBannerProps {
  endsAt: Date;
}

export function TrialBanner({ endsAt }: TrialBannerProps) {
  const daysRemaining = Math.max(0, dayjs(endsAt).diff(dayjs(), "day"));

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="container flex items-center justify-between">
        <p className="text-sm">
          <span className="font-medium">Trial period:</span>{" "}
          {daysRemaining === 0
            ? "Ends today"
            : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
        </p>
        <Button size="sm" asChild>
          <Link href="/dashboard/billing">Upgrade Now</Link>
        </Button>
      </div>
    </div>
  );
}
