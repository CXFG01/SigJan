import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Link className="brand" href="/" aria-label="SignalRx home">
      <span className="brand-mark" aria-hidden="true" />
      {!compact && (
        <span className="brand-word">
          Signal<span className="brand-rx">Rx</span>
        </span>
      )}
    </Link>
  );
}
