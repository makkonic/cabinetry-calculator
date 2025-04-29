import Link from "next/link"

export function Header() {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-gray-800">THELIA GROUP</h1>
          <span className="text-sm text-gray-500">Cabinet Calculator</span>
        </Link>
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Calculator
          </Link>
          <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
            Saved Quotes
          </Link>
        </nav>
      </div>
    </header>
  )
}
