type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect x="1" y="1" width="22" height="22" rx="5" fill="currentColor" />
      <rect x="6.5" y="6.5" width="11" height="11" rx="3" fill="var(--background)" />
      <rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}
