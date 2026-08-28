import Image from "next/image";

export default function ForgeLogo({
  size = 80,
}: {
  size?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
      }}
      className="relative inline-block shrink-0"
    >
      <Image
        src="/myforge-logo-light.png"
        alt="MyForge"
        width={size}
        height={size}
        className="h-full w-full object-contain dark:hidden"
      />
      <Image
        src="/myforge-logo-dark.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="hidden h-full w-full object-contain dark:block"
      />
    </span>
  );
}
