/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Extracted Video Component to handle independent fetching of presigned URLs
function AdminVideoPlayer({ submissionId }: { submissionId: string }) {
    const [url, setUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        async function fetchUrl() {
            try {
                const res = await fetch(`/api/v1/admin/submissions/${submissionId}/video`)
                if (res.ok) {
                    const data = await res.json()
                    setUrl(data.url)
                } else {
                    setError(true)
                }
            } catch {
                setError(true)
            }
        }
        fetchUrl()
    }, [submissionId])

    if (error) {
        return <span className="text-white text-sm">Video Preview Error</span>
    }

    if (!url) {
        return <span className="text-white text-sm animate-pulse">Loading Video...</span>
    }

    return (
        <video src={url} controls className="w-full h-full object-cover" />
    )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/submissions/queue')
      if (res.status === 401 || res.status === 403) router.push('/api/auth/signin')
      if (res.ok) {
         const data = await res.json()
         setQueue(data)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
     // eslint-disable-next-line react-hooks/set-state-in-effect
     fetchQueue()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
             {loading ? 'Loading...' : 'Refresh Queue'}
        </button>
        <div className="bg-gray-100 p-4 rounded-lg">
           {queue.length > 0 ? (
            <ul className="space-y-4">
              {queue.map((s: any) => (
                <li key={s.id} className="bg-white p-4 rounded shadow flex flex-col md:flex-row gap-6">
                   <div className="w-full md:w-1/3 bg-black flex items-center justify-center rounded overflow-hidden aspect-video">
                       <AdminVideoPlayer submissionId={s.id} />
                   </div>

                   <div className="w-full md:w-2/3">
                       <h3 className="font-bold text-lg">Mission: {s.mission.title}</h3>
                       <p className="text-sm text-gray-600 mt-1"><strong>Creator:</strong> {s.creator.name} ({s.creator.email})</p>
                       <div className="grid grid-cols-2 gap-4 mt-4 bg-gray-50 p-3 rounded border">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                                <p className="font-mono text-sm">{s.duration_seconds}s</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Resolution</p>
                                <p className="font-mono text-sm">{s.resolution_width}x{s.resolution_height} @ {s.fps}fps</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Auto-Labels</p>
                                <p className="text-sm italic">{s.labels_summary?.action_summary || 'N/A'}</p>
                            </div>
                       </div>

                       <div className="mt-6 flex gap-3">
                           <button onClick={() => reviewSubmission(s.id, 'ACCEPTED', (s.duration_seconds || 0)/60)} className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 font-medium">
                               Approve & Pay Full
                           </button>
                           <button onClick={() => reviewSubmission(s.id, 'REJECTED', 0)} className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 font-medium">
                               Reject
                           </button>
                       </div>
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
