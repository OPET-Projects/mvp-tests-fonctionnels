"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

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
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("User validation failed");
        }

        const data = await response.json();
        const userExists = Array.isArray(data)
          ? data.length > 0
          : Boolean(data?.id);

        if (!userExists) {
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

    validateAuth().then();

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
