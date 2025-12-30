"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export function CheckoutSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Welcome to Pro!", {
        description: "Your purchase was successful. Enjoy your new features!",
      });
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  return null;
}
