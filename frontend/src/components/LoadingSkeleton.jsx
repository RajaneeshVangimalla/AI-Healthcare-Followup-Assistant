function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="grid gap-3" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}

export default LoadingSkeleton;
