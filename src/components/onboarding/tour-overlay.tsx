"use client";

interface TourOverlayProps {
  targetRect: DOMRect | null;
  padding?: number;
}

export function TourOverlay({ targetRect, padding = 4 }: TourOverlayProps) {
  // If no target, show full overlay
  if (!targetRect) {
    return (
      <div className="fixed inset-0 z-40 bg-black/70" aria-hidden="true" />
    );
  }

  // Calculate hole position with padding
  const top = targetRect.top - padding;
  const left = targetRect.left - padding;
  const bottom = targetRect.bottom + padding;
  const right = targetRect.right + padding;

  // Create clip-path polygon that covers everything EXCEPT the target area
  // This creates a shape with a rectangular hole
  const clipPath = `polygon(
    0% 0%,
    0% 100%,
    ${left}px 100%,
    ${left}px ${top}px,
    ${right}px ${top}px,
    ${right}px ${bottom}px,
    ${left}px ${bottom}px,
    ${left}px 100%,
    100% 100%,
    100% 0%
  )`;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/70"
      style={{ clipPath }}
      aria-hidden="true"
    />
  );
}
