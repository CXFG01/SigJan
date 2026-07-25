import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner shell-width">
        <BrandMark />
        <p>Built with synthetic demonstration data. Not a clinical service.</p>
        <Link className="text-link" href="/about/safety">
          Product boundaries
        </Link>
      </div>
    </footer>
  );
}
