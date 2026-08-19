export default function ForgeLogo({
  size = 80,
}: {
  size?: number;
}) {
  return (
    <img
      src="/logo-forge-v1.png"
      alt="Forge"
      style={{
        width: size,
        height: size,
      }}
      className="rounded-3xl"
    />
  );
}