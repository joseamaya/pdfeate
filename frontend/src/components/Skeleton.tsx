interface SkeletonProps {
  rows?: number;
  height?: string;
  className?: string;
}

export default function Skeleton({ rows = 3, height = "h-4", className = "" }: SkeletonProps) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-border rounded-lg ${i === rows - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}
