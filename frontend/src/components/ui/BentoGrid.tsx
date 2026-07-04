import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
}

export function BentoItem({ children, className, colSpan = 1 }: BentoItemProps) {
  const spanClass =
    colSpan === 3
      ? "md:col-span-3"
      : colSpan === 2
        ? "md:col-span-2"
        : "md:col-span-1";

  return (
    <div className={cn("glass-card p-5", spanClass, className)}>
      {children}
    </div>
  );
}
