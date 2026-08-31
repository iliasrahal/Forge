import GuestOnly from "@/components/auth/GuestOnly";

export default function ActivateAccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GuestOnly>{children}</GuestOnly>;
}
