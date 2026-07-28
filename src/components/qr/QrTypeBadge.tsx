import { cn } from "@/lib/utils";
import { qrTypeAccentHue, qrTypeLabels, type QrType } from "@/lib/qr-schema";
import { qrTypeIcons } from "@/components/qr/QrTypeSelector";

type QrTypeBadgeProps = {
  type: QrType;
  className?: string;
};

export function QrTypeBadge({ type, className }: QrTypeBadgeProps) {
  const Icon = qrTypeIcons[type];
  const accent = `hsl(${qrTypeAccentHue[type]} 65% 45%)`;

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.6rem] tracking-wide uppercase",
        className,
      )}
      style={{
        color: `color-mix(in oklch, ${accent} 75%, var(--foreground))`,
        backgroundColor: `color-mix(in oklch, ${accent} 16%, var(--background))`,
        borderColor: `color-mix(in oklch, ${accent} 35%, var(--border))`,
      }}
    >
      <Icon className="size-3" strokeWidth={2} />
      {qrTypeLabels[type]}
    </span>
  );
}
