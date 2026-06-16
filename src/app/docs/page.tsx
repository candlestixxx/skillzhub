"use client"

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import swagger-ui to prevent SSR issues, as it relies on the browser DOM
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function DocsPage() {
  return (
    <div className="container mx-auto py-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 px-4 text-center">SkillzHub API Documentation</h1>
      <SwaggerUI url="/api/v1/docs" />
    </div>
  )
}
