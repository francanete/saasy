"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Settings, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appConfig } from "@/lib/config";
import { useSession, signOut } from "@/lib/auth-client";

const navigation = [
  { name: "Features", href: "/#features" },
  { name: "Pricing", href: "/pricing" },
];

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
}

export function Navbar() {
  const { data: session, isPending } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileMenuOpen
            ? "bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
            : "bg-white/0 border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="shrink-0 flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 tracking-tight"
              >
                {appConfig.name}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Side - Auth & Mobile Menu Button */}
            <div className="flex items-center gap-4">
              {/* Desktop Auth */}
              <div className="hidden md:flex items-center gap-4">
                {isPending ? null : session ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full">
                        <Avatar className="h-9 w-9 ring-2 ring-gray-100 hover:ring-gray-200 transition-all">
                          <AvatarImage
                            src={session.user.image || undefined}
                            alt={
                              session.user.name || session.user.email || "User"
                            }
                          />
                          <AvatarFallback>
                            {getInitials(session.user.name, session.user.email)}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          {session.user.name && (
                            <p className="text-sm font-medium leading-none">
                              {session.user.name}
                            </p>
                          )}
                          <p className="text-xs leading-none text-muted-foreground">
                            {session.user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                      Sign in
                    </Link>
                    <Button asChild>
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                  aria-expanded={isMobileMenuOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`md:hidden fixed inset-0 z-40 bg-white transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ top: "64px" }}
        >
          <div className="px-4 pt-4 pb-3 space-y-2 border-t border-gray-100">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-4 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {isPending ? null : session ? (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="flex items-center px-3 mb-4">
                  <Avatar className="h-10 w-10 ring-2 ring-gray-100">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || session.user.email || "User"}
                    />
                    <AvatarFallback>
                      {getInitials(session.user.name, session.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    {session.user.name && (
                      <div className="text-base font-medium text-gray-800">
                        {session.user.name}
                      </div>
                    )}
                    <div className="text-sm font-medium text-gray-500">
                      {session.user.email}
                    </div>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center px-3 py-4 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="mr-3 h-5 w-5 text-gray-500" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center px-3 py-4 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="mr-3 h-5 w-5 text-gray-500" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-4 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                <Link
                  href="/login"
                  className="block px-3 py-4 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-4 rounded-md text-base font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16 md:h-20" />
    </>
  );
}
