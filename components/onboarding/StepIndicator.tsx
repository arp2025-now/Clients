interface StepIndicatorProps {
  current: number;
  total: number;
  labels: string[];
}

export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? "ap-gradient text-white"
                    : active
                    ? "border-2 border-[#1CA9C9] text-[#1CA9C9] bg-[rgba(28,169,201,0.1)]"
                    : "border-2 border-border text-muted-foreground"
                }`}
              >
                {done ? "✓" : step}
              </div>
              <span
                className={`text-[10px] hidden sm:block ${
                  active ? "text-[#1CA9C9] font-semibold" : "text-muted-foreground"
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 mb-5 transition-all ${
                  done ? "bg-[#1CA9C9]" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
