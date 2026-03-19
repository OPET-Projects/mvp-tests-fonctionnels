"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

const NavBar = () => {
  const router = useRouter();
  usePathname();

  const isConnected = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem("isConnected") === "true",
    () => false,
  );

  const handleLogout = () => {
    localStorage.removeItem("isConnected");
    localStorage.removeItem("userCode");
    router.push("/");
  };

  if (!isConnected) {
    return null;
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">Troc de vinyles</h1>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link href="/vinyls">Accueil</Link>
              <Link href="/my-vinyls">Ses vinyles</Link>
              <Link href="/exchanges">Demandes</Link>
              <button type="button" onClick={handleLogout}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
