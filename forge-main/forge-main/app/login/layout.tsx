import GuestOnly from "@/components/auth/GuestOnly";

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GuestOnly>{children}</GuestOnly>;
}
