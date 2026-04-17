"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { apiCall } from "@/lib/api";
import { User } from "@/lib/types/user";

type AuthGuardProps = {
  children: ReactNode;
};

type AuthStatus = "checking" | "authorized" | "unauthorized";

const AuthGuard = ({ children }: AuthGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const validateAuth = async () => {
      if (pathname === "/") {
        if (!cancelled) {
          setStatus("authorized");
        }
        return;
      }

      const userId = localStorage.getItem("userId");
      if (!userId) {
        if (!cancelled) {
          setStatus("unauthorized");
          router.replace("/");
        }
        return;
      }

      try {
        const user = await apiCall<User>(`/api/users/${userId}`);

        if (!user?.id) {
          localStorage.removeItem("userId");
          if (!cancelled) {
            setStatus("unauthorized");
            router.replace("/");
          }
          return;
        }

        if (!cancelled) {
          setStatus("authorized");
        }
      } catch {
        localStorage.removeItem("userId");
        if (!cancelled) {
          setStatus("unauthorized");
          router.replace("/");
        }
      }
    };

    void validateAuth();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (pathname !== "/" && status !== "authorized") {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
