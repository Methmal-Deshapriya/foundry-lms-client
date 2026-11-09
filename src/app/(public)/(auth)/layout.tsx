import React from "react";
import GuestGuard from "@/features/auth/components/GuestGuard";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GuestGuard>{children}</GuestGuard>;
}