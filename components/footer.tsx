import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-6 md:px-0">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-semibold">Skill Link</span>
          </Link>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="/terms" className="text-xs sm:text-sm text-muted-foreground hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs sm:text-sm text-muted-foreground hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link href="/faq" className="text-xs sm:text-sm text-muted-foreground hover:underline underline-offset-4">
              FAQ
            </Link>
          </nav>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Skill Link. All rights reserved.
        </p>
      </div>
    </footer>
  );
}