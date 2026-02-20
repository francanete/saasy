export function PlauderaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bottom layer */}
      <path
        d="M24 40L8 28L24 16L40 28L24 40Z"
        fill="currentColor"
        opacity="0.2"
      />
      {/* Middle layer */}
      <path
        d="M24 32L8 20L24 8L40 20L24 32Z"
        fill="currentColor"
        opacity="0.5"
      />
      {/* Top layer */}
      <path d="M24 24L8 12L24 0L40 12L24 24Z" fill="currentColor" />
    </svg>
  );
}
