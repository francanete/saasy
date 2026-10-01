export default function AuthLoading() {
  return (
    <div className="bg-card border-border space-y-4 rounded-2xl border p-8 shadow-sm">
      <div className="bg-muted mx-auto h-10 w-10 animate-pulse rounded" />
      <div className="bg-muted mx-auto h-6 w-32 animate-pulse rounded" />
      <div className="bg-muted h-10 w-full animate-pulse rounded" />
      <div className="bg-muted h-10 w-full animate-pulse rounded" />
      <div className="bg-muted h-10 w-full animate-pulse rounded" />
    </div>
  );
}
