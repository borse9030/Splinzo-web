import Image from "next/image";

interface SplinzoLogoProps {
  /** Pixel size of the logo image (square). Default 36. */
  size?: number;
  /** Extra class names for the outer wrapper */
  className?: string;
  /** Show the "Splinzo" wordmark next to the logo */
  showName?: boolean;
  /** Text size class for the wordmark, e.g. "text-xl" */
  nameSize?: string;
  /** Text colour for the wordmark */
  nameColor?: string;
}

/**
 * Shared Splinzo logo component.
 * Uses /logo.png (copied from "web logo.png") served from the public folder.
 */
export function SplinzoLogo({
  size = 36,
  className = "",
  showName = true,
  nameSize = "text-xl",
  nameColor = "#111827",
}: SplinzoLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo.png"
        alt="Splinzo logo"
        width={size}
        height={size}
        className="rounded-xl shadow-sm"
        priority
      />
      {showName && (
        <span
          className={`font-black tracking-tight ${nameSize}`}
          style={{ color: nameColor }}
        >
          Splinzo
        </span>
      )}
    </div>
  );
}
