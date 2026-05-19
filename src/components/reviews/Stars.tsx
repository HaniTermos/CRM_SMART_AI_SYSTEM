import { Star } from "lucide-react";

export function StarRating({
  value,
  size = 16,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.floor(rounded);
        const half = !filled && n - 0.5 === rounded;
        return (
          <Star
            key={n}
            style={{ width: size, height: size }}
            className={
              filled
                ? "fill-yellow-400 text-yellow-400"
                : half
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-muted-foreground/40"
            }
          />
        );
      })}
    </div>
  );
}

export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={
              n <= value
                ? "h-6 w-6 fill-yellow-400 text-yellow-400"
                : "h-6 w-6 text-muted-foreground/40"
            }
          />
        </button>
      ))}
    </div>
  );
}
