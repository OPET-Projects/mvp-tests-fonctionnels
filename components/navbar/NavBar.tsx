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
    () =>
      localStorage.getItem("userId") !== null &&
      localStorage.getItem("userId") !== undefined,
    () => false,
  );

  const handleLogout = () => {
    localStorage.removeItem("userId");
    router.push("/");
  };

  if (!isConnected) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">Troc de vinyles</h1>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link href="/vinyls" className="hover:text-gray-600">
                Accueil
              </Link>
              <Link href="/my-vinyls" className="hover:text-gray-600">
                Ses vinyles
              </Link>
              <Link href="/exchanges" className="hover:text-gray-600">
                Demandes
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hover:text-gray-600 cursor-pointer"
              >
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
