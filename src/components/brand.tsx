import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="SignalRx home">
      <span className="brand-mark" aria-hidden="true" />
      <span>
        Signal<span className="brand-rx">Rx</span>
      </span>
    </Link>
  );
}
