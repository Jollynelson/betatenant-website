"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, ChevronDown } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-[0px_4px_39px_6px_rgba(217,217,217,0.25)]">
      <nav className="max-w-[1360px] mx-auto px-5 lg:px-10">
        <div className="flex items-center justify-between h-[72px] lg:h-[78px]">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/bt_logo_big.svg"
              alt="Beta Tenant"
              width={122}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav Center */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLink href="/tenant-switch">Tenant Switch</NavLink>
            <NavLink href="https://gist.betatenant.com" external>
              Area Gist
            </NavLink>
            <NavLink href="/report/search">Report Agent</NavLink>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 text-sm font-semibold text-bt-primary hover:bg-bt-primary/5 rounded-full transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-neutral-100 bg-white overflow-hidden"
          >
            <div className="px-5 py-5 space-y-1">
              <MobileNavLink
                href="/tenant-switch"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tenant Switch
              </MobileNavLink>
              <MobileNavLink
                href="https://gist.betatenant.com"
                onClick={() => setMobileMenuOpen(false)}
              >
                Area Gist
              </MobileNavLink>
              <MobileNavLink
                href="/report/search"
                onClick={() => setMobileMenuOpen(false)}
              >
                Report Agent
              </MobileNavLink>
              <div className="pt-4 border-t border-neutral-100 mt-4 space-y-3">
                <Link
                  href="/auth/login"
                  className="block w-full text-center px-5 py-3 rounded-full border-2 border-bt-primary text-bt-primary font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block w-full text-center px-5 py-3 rounded-full bg-bt-primary text-white font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "px-4 py-2 text-sm font-medium text-neutral-700 hover:text-bt-primary rounded-lg transition-colors";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} underline underline-offset-2`}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-50 rounded-xl transition-colors"
    >
      {children}
    </Link>
  );
}
