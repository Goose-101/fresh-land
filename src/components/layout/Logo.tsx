import Link from "next/link";
import Image from "next/image";

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  const dims = {
    sm: { w: 180, h: 120, cls: "h-14 w-auto" },
    md: { w: 320, h: 213, cls: "h-24 sm:h-28 w-auto" },
    lg: { w: 480, h: 320, cls: "h-36 sm:h-40 w-auto" },
  }[size];

  return (
    <Link href={href} className="inline-flex items-center group">
      <Image
        src="/Fresh Land.png"
        alt="Fresh Land"
        width={dims.w}
        height={dims.h}
        priority
        className={`${dims.cls} object-contain group-hover:opacity-90 transition`}
      />
    </Link>
  );
}
