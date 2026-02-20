"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Layers,
} from "lucide-react";
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
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = [
  { name: "Features", href: "/#features" },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
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
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ease-in-out ${
          isScrolled || isMobileMenuOpen
            ? "border-border/60 bg-background/90 border-b py-3 shadow-sm backdrop-blur-md"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex shrink-0 items-center">
              <Link href="/" className="group flex items-center gap-2">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg shadow-md transition-transform group-hover:scale-105">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="text-foreground text-lg font-bold tracking-tight transition-colors">
                  {appConfig.name}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-8 md:flex">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Side - Auth & Mobile Menu Button */}
            <div className="flex items-center gap-4">
              {appConfig.theme.allowToggle && <ThemeToggle />}
              {/* Desktop Auth */}
              <div className="hidden items-center gap-4 md:flex">
                {isPending ? null : session ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="border-border bg-background hover:border-border focus:ring-primary/20 flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 transition-all focus:ring-2 focus:outline-none">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={session.user.image || undefined}
                            alt={
                              session.user.name || session.user.email || "User"
                            }
                          />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {getInitials(session.user.name, session.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground text-sm font-medium">
                          Account
                        </span>
                        <ChevronDown className="text-muted-foreground h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56 rounded-xl"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="border-border border-b px-3 py-2 font-normal">
                        <div className="flex flex-col space-y-1">
                          {session.user.name && (
                            <p className="text-foreground text-sm font-medium">
                              {session.user.name}
                            </p>
                          )}
                          <p className="text-muted-foreground truncate text-xs">
                            {session.user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard"
                          className="text-foreground hover:bg-muted flex items-center gap-2 rounded-lg px-3 py-2"
                        >
                          <LayoutDashboard className="text-muted-foreground h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/settings"
                          className="text-foreground hover:bg-muted flex items-center gap-2 rounded-lg px-3 py-2"
                        >
                          <Settings className="text-muted-foreground h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-muted" />
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="cursor-pointer rounded-lg px-3 py-2 text-red-600 hover:bg-red-50"
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
                      className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center rounded-md p-2 transition-colors focus:outline-none"
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
          className={`bg-background/95 fixed inset-0 z-40 backdrop-blur-sm transition-all duration-300 md:hidden ${
            isMobileMenuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          style={{ top: "60px" }}
        >
          <div className="border-border space-y-1 border-t px-4 pt-4 pb-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-foreground hover:bg-muted hover:text-primary block rounded-lg px-3 py-3 text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {isPending ? null : session ? (
              <div className="border-border mt-6 border-t pt-6">
                <div className="mb-4 flex items-center px-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || session.user.email || "User"}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {getInitials(session.user.name, session.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    {session.user.name && (
                      <div className="text-foreground text-base font-medium">
                        {session.user.name}
                      </div>
                    )}
                    <div className="text-muted-foreground text-sm font-medium">
                      {session.user.email}
                    </div>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="text-foreground hover:bg-muted flex items-center rounded-lg px-3 py-3 text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="text-muted-foreground mr-3 h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="text-foreground hover:bg-muted flex items-center rounded-lg px-3 py-3 text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="text-muted-foreground mr-3 h-5 w-5" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-3 text-base font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="border-border mt-6 space-y-3 border-t px-3 pt-6">
                <Link
                  href="/login"
                  className="border-border text-foreground hover:bg-muted block w-full rounded-lg border px-3 py-3 text-center text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 block w-full rounded-lg px-3 py-3 text-center text-base font-medium shadow-md transition-colors"
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
