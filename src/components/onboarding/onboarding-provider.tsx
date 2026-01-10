"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { tourSteps, type TourStep } from "@/lib/onboarding-config";
import { useIsMobile } from "@/hooks/use-mobile";
import { TourOverlay } from "./tour-overlay";
import { TourCard } from "./tour-card";

interface OnboardingContextValue {
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
  onboardingCompleted,
}: {
  children: ReactNode;
  onboardingCompleted: boolean;
}) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  // Filter out desktop-only steps on mobile
  const activeSteps = useMemo(() => {
    if (isMobile) {
      return tourSteps.filter((step) => !step.desktopOnly);
    }
    return tourSteps;
  }, [isMobile]);

  const currentStepData: TourStep | undefined = activeSteps[currentStep];

  // Handle SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Find and track target element position
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const updateTargetRect = () => {
      const target = document.querySelector(currentStepData.selector);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    };

    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect);

    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [isActive, currentStep, currentStepData]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const closeTour = useCallback(async () => {
    setIsActive(false);
    await fetch("/api/onboarding/skip", { method: "POST" });
  }, []);

  const nextStep = useCallback(async () => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setIsActive(false);
      await fetch("/api/onboarding/complete", { method: "POST" });
    }
  }, [currentStep, activeSteps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Auto-start for new users
  useEffect(() => {
    if (!onboardingCompleted && mounted) {
      const timer = setTimeout(startTour, 500);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted, startTour, mounted]);

  return (
    <OnboardingContext.Provider value={{ isActive, currentStep, startTour }}>
      {children}
      {mounted &&
        isActive &&
        currentStepData &&
        targetRect &&
        createPortal(
          <>
            <TourOverlay targetRect={targetRect} />
            <TourCard
              step={currentStepData}
              currentStep={currentStep}
              totalSteps={activeSteps.length}
              targetRect={targetRect}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={closeTour}
            />
          </>,
          document.body
        )}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboardingContext must be used within OnboardingProvider"
    );
  }
  return context;
}
