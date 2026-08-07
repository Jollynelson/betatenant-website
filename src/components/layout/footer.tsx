import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-100">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Logo & description */}
          <div className="lg:min-w-[220px] lg:max-w-[260px]">
            <Link href="/">
              <Image
                src="/images/bt_logo_big.png"
                alt="Beta Tenant"
                width={122}
                height={32}
                className="h-7 w-auto"
              />
            </Link>
            <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
              Nigeria&apos;s trusted rental marketplace. Find verified properties and reliable agents.
            </p>
            <p className="text-xs text-neutral-400 mt-4">
              &copy; {new Date().getFullYear()} Beta Tenant. All rights reserved.
            </p>
          </div>

          {/* Links Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                <FooterLink href="/about">About us</FooterLink>
                <FooterLink href="mailto:support@betatenant.com">Contact us</FooterLink>
                <FooterLink href="/terms-and-conditions">
                  Terms and conditions
                </FooterLink>
                <FooterLink href="/privacy-policies">
                  Privacy policies
                </FooterLink>
              </ul>
            </div>

            {/* Tenants */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                Tenants
              </h3>
              <ul className="space-y-3">
                <FooterLink href="/how-it-works">How it works</FooterLink>
                <FooterLink href="/properties">Properties</FooterLink>
                <FooterLink href="/saved">Saved Homes</FooterLink>
                <FooterLink href="/agents">Report Agent</FooterLink>
              </ul>
            </div>

            {/* Landlords */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                Landlords/Sellers
              </h3>
              <ul className="space-y-3">
                <FooterLink href="/host/new">List a Property</FooterLink>
                <FooterLink href="/host">Dashboard</FooterLink>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                Follow us
              </h3>
              <div className="flex items-center gap-3">
                <SocialIcon
                  href="https://www.instagram.com/betatenanthq"
                  label="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </SocialIcon>
                <SocialIcon
                  href="https://www.linkedin.com/company/betatenant/"
                  label="LinkedIn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </SocialIcon>
                <SocialIcon
                  href="https://www.facebook.com/share/128kaDfMfEt/"
                  label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </SocialIcon>
                <SocialIcon
                  href="https://x.com/betatenant"
                  label="X (Twitter)"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </SocialIcon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-bt-primary/8 hover:text-bt-primary transition-colors"
    >
      {children}
    </a>
  );
}
