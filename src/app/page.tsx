import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to SkillzHub</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl">
        The C2B marketplace for skilled GoPro and FPV footage used to train embodied AI models and robotics.
      </p>

      <div className="flex gap-4">
        <Link href="/api/auth/signin" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold transition">
          Login / Sign Up
        </Link>
      </div>

      <div className="mt-12 text-left bg-gray-100 p-6 rounded-lg max-w-xl">
        <h2 className="text-xl font-bold mb-2">Test Accounts:</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li><strong>Creator:</strong> creator@example.com / creator123</li>
          <li><strong>Company:</strong> tesla@company.com / company123</li>
          <li><strong>Admin:</strong> admin@skillzhub.com / admin123</li>
        </ul>
      </div>
    </div>
  )
}
