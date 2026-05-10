"use client"
import { useState } from "react"

export default function AdminDashboard() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/submissions/queue')
      if (res.ok) {
         const data = await res.json()
         setQueue(data)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const reviewSubmission = async (id: string, status: string, minutes: number) => {
    try {
      await fetch(`/api/v1/admin/submissions/${id}/review`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status, accepted_minutes: minutes })
      })
      fetchQueue()
    } catch(e) {
      console.error(e)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin QC Dashboard</h1>
      <p>System Oversight & QC Queue</p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Submissions Pending Review</h2>
        <button onClick={fetchQueue} disabled={loading} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition disabled:opacity-50">
             {loading ? 'Loading...' : 'Load Queue'}
        </button>
        <div className="bg-gray-100 p-4 rounded-lg">
           {queue.length > 0 ? (
            <ul className="space-y-4">
              {queue.map((s: any) => (
                <li key={s.id} className="bg-white p-4 rounded shadow">
                   <h3 className="font-bold">Mission: {s.mission.title}</h3>
                   <p className="text-sm text-gray-600">Creator: {s.creator.name} ({s.creator.email})</p>
                   <p className="text-sm text-gray-600 mt-2">Duration: {s.duration_seconds}s | Resoluton: {s.resolution_width}x{s.resolution_height}</p>
                   <div className="mt-4 flex gap-2">
                       <button onClick={() => reviewSubmission(s.id, 'ACCEPTED', (s.duration_seconds || 0)/60)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Accept Full</button>
                       <button onClick={() => reviewSubmission(s.id, 'REJECTED', 0)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Reject</button>
                   </div>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-gray-600 italic">No submissions in queue.</p>
          )}
        </div>
      </div>
    </div>
  )
}
