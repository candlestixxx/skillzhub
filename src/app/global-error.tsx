'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Critical System Error</h2>
        <p className="text-gray-600 mb-8 max-w-md">A critical application error occurred. We apologize for the inconvenience.</p>
        <button
           onClick={() => reset()}
           className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
            Attempt Recovery
        </button>
      </body>
    </html>
  )
}
