import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function MarketingHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner shell-width">
        <BrandMark />
        <nav className="site-header-actions" aria-label="Primary navigation">
          <Link className="button button-ghost" href="/about/safety">
            How safety works
          </Link>
          <Link className="button button-secondary" href="/demo">
            Open demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
