import GuestOnly from "@/components/auth/GuestOnly";

export default function ResetPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GuestOnly>{children}</GuestOnly>;
}
