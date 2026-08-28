import Image from "next/image";

type ForgeSymbolProps = {
  size?: number;
  className?: string;
};

export default function ForgeSymbol({
  size = 20,
  className = "",
}: ForgeSymbolProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`relative inline-block shrink-0 ${className}`}
    >
      <Image
        src="/myforge-email-symbol.png"
        alt=""
        fill
        sizes={`${size}px`}
        className="object-contain"
      />
    </span>
  );
}
