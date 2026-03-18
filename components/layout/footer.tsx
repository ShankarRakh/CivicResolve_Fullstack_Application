import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                CR
              </div>
              <span className="font-semibold">CivicResolve</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering citizens to improve their city. Report issues, track progress, hold your municipality accountable.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/track" className="hover:text-foreground">Track Complaint</Link></li>
              <li><Link href="/feed" className="hover:text-foreground">Public Feed</Link></li>
              <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Login</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Categories</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/feed?category=water" className="hover:text-foreground">Water Supply</Link></li>
              <li><Link href="/feed?category=roads" className="hover:text-foreground">Roads</Link></li>
              <li><Link href="/feed?category=garbage" className="hover:text-foreground">Garbage</Link></li>
              <li><Link href="/feed?category=lights" className="hover:text-foreground">Street Lights</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Helpline: 1800-XXX-XXXX</li>
              <li>Email: help@civicresolve.gov.in</li>
              <li>Municipal Corporation Office</li>
              <li>Pune - 411001</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              A Govt. of Maharashtra Initiative under Digital India Programme
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
              <Link href="/accessibility" className="hover:text-foreground">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
