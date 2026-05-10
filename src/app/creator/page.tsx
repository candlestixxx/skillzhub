"use client"
import { useState } from "react"

export default function CreatorDashboard() {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  const fetchMissions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/missions?status=OPEN')
      const data = await res.json()
      setMissions(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleUpload = async (missionId: string) => {
    setUploadingFor(missionId)
    try {
      const initRes = await fetch(`/api/v1/missions/${missionId}/submissions/init-upload`, { method: 'POST' })
      const initData = await initRes.json()

      await new Promise(r => setTimeout(r, 1000))

      await fetch(`/api/v1/missions/${missionId}/submissions/complete-upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: initData.submissionId })
      })
      alert('Upload completed! Submission is processing.')
    } catch (e) {
      alert('Upload failed')
    }
    setUploadingFor(null)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Creator Dashboard</h1>
      <p>Welcome to SkillzHub</p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Available Missions</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <button onClick={fetchMissions} disabled={loading} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition disabled:opacity-50">
             {loading ? 'Loading...' : 'Load Open Missions'}
          </button>

          {missions.length > 0 ? (
            <ul className="space-y-4">
              {missions.map((m: any) => (
                <li key={m.id} className="bg-white p-4 rounded shadow">
                   <h3 className="font-bold">{m.title}</h3>
                   <p className="text-sm text-gray-600">{m.description}</p>
                   <p className="text-sm font-semibold mt-2">Price: ${m.price_per_minute}/min | {m.license_type}</p>
                   <button disabled={uploadingFor === m.id} onClick={() => handleUpload(m.id)} className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50">
                      {uploadingFor === m.id ? 'Uploading...' : 'Accept & Upload Fake File'}
                   </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 italic">No missions loaded.</p>
          )}
        </div>
      </div>
    </div>
  )
}
