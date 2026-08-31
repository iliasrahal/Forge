import GuestOnly from "@/components/auth/GuestOnly";

export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GuestOnly>{children}</GuestOnly>;
}
