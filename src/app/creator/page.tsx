/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Extracted Video Component for Creator Playback
function CreatorVideoPlayer({ submissionId }: { submissionId: string }) {
    const [url, setUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        async function fetchUrl() {
            try {
                const res = await fetch(`/api/v1/creator/submissions/${submissionId}/video`)
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
        return <span className="text-white text-xs">Video Preview Error</span>
    }

    if (!url) {
        return <span className="text-white text-xs animate-pulse">Loading Video...</span>
    }

    return (
        <video src={url} controls className="w-full h-full object-cover" />
    )
}

export default function CreatorDashboard() {
  const router = useRouter()
  const [missions, setMissions] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [profile, setProfile] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/v1/auth/me')
      if (res.ok) setProfile(await res.json())
    } catch {}
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch open missions
      const missionsRes = await fetch('/api/v1/missions?status=OPEN')
      if (missionsRes.status === 401 || missionsRes.status === 403) router.push('/api/auth/signin')

      if (missionsRes.ok) {
         setMissions(await missionsRes.json())
      }

      // Fetch creator's past submissions
      const subRes = await fetch('/api/v1/creator/submissions')
      if (subRes.ok) {
          setSubmissions(await subRes.json())
      }

      // Fetch leaderboard
      const leadRes = await fetch('/api/v1/creators/leaderboard')
      if (leadRes.ok) {
          setLeaderboard(await leadRes.json())
      }

    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProfile()
        fetchDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpload = async (missionId: string) => {
    if (!profile?.payout_account_id) {
       alert('Please onboard with Stripe to receive payouts before accepting missions.');
       return;
    }

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
      fetchDashboardData() // refresh to show the new submission in the list
    } catch {
      alert('Upload failed')
    }
    setUploadingFor(null)
  }

  const handleStripeOnboard = async () => {
      try {
          const res = await fetch('/api/v1/creator/onboarding', { method: 'POST' })
          if (res.ok) {
              const data = await res.json()
              alert(`Navigating to Stripe Connect Onboarding:\n${data.url}`)
              // window.location.href = data.url
              fetchProfile()
          }
      } catch {}
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-600">Welcome back, {profile?.name || 'Creator'}</p>
                {profile?.trust_tier && (
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                        profile.trust_tier === 'HIGH_TRUST' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                        {profile.trust_tier.replace('_', ' ')}
                    </span>
                )}
                {profile?.reputation_score !== undefined && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Score: {profile.reputation_score}
                    </span>
                )}
            </div>
          </div>
          <div>
             {!profile?.payout_account_id ? (
                 <button onClick={handleStripeOnboard} className="bg-[#635BFF] text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-[#4b45cf] transition font-medium w-full md:w-auto">
                     Setup Stripe Payouts
                 </button>
             ) : (
                 <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-800 text-sm font-semibold">Stripe Connected</span>
                 </div>
             )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {/* Submissions History Section */}
            {submissions.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Recent Submissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((sub: any) => (
                    <div key={sub.id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-gray-50">
                        {/* Video Player */}
                        <div className="w-full bg-black flex items-center justify-center aspect-video relative">
                             <CreatorVideoPlayer submissionId={sub.id} />
                             {/* Status Badge Overlay */}
                             <div className="absolute top-2 right-2">
                                <span className={`text-xs px-2 py-1 rounded shadow-sm font-medium ${
                                    sub.processing_status === 'ACCEPTED' ? 'bg-green-500 text-white' :
                                    sub.processing_status === 'REJECTED' || sub.processing_status === 'AUTO_QC_FAIL' ? 'bg-red-500 text-white' :
                                    'bg-yellow-500 text-white'
                                }`}>
                                    {sub.processing_status.replace(/_/g, ' ')}
                                </span>
                             </div>
                        </div>
                        {/* Meta */}
                        <div className="p-4 bg-white flex-1 flex flex-col">
                            <h3 className="font-semibold text-gray-800 line-clamp-1" title={sub.mission.title}>{sub.mission.title}</h3>
                            <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                                {sub.duration_seconds && <span>{sub.duration_seconds}s</span>}
                            </div>
                            {sub.payout_amount && (
                                <div className="mt-auto pt-3 mt-3 border-t border-gray-100">
                                    <p className="text-sm font-medium text-gray-900 flex justify-between">
                                        <span>Payout:</span>
                                        <span className="text-green-600">${sub.payout_amount.toFixed(2)}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                </div>
              </div>
            )}

            {/* Missions Board Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Available Missions</h2>
            <button onClick={fetchDashboardData} disabled={loading} className="text-blue-600 text-sm hover:underline disabled:opacity-50 font-medium">
                {loading ? 'Refreshing...' : 'Refresh Board'}
            </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          {missions.length > 0 ? (
            <ul className="space-y-4">
              {missions.map((m: any) => (
                <li key={m.id} className="bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 transition">
                   <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                       <div className="flex-1">
                           <h3 className="font-bold text-lg text-gray-900">{m.title}</h3>
                           <p className="text-sm text-gray-600 mt-1 max-w-2xl">{m.description}</p>
                           <div className="mt-3 flex gap-2 flex-wrap">
                               <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">FPS: {m.required_fps || 'Any'}</span>
                               <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">Res: {m.required_resolution || 'Any'}</span>
                               <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">Env: {m.environment_type}</span>
                           </div>
                       </div>
                       <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 mt-3 md:mt-0">
                           <p className="text-2xl font-bold text-green-600">${m.price_per_minute.toFixed(2)}<span className="text-sm text-gray-500 font-normal">/min</span></p>
                           <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-medium">{m.license_type}</p>
                       </div>
                   </div>

                   <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                       <button disabled={uploadingFor === m.id} onClick={() => handleUpload(m.id)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm transition w-full md:w-auto">
                          {uploadingFor === m.id ? 'Uploading...' : 'Accept & Upload Video'}
                       </button>
                   </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
               <p className="text-gray-500">No open missions available right now.</p>
               <p className="text-xs text-gray-400 mt-2">Check back later for new opportunities.</p>
            </div>
          )}
        </div>
      </div>
        </div>

        <div className="space-y-8">
            {/* Leaderboard Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Top Creators</h2>
                </div>

                <div className="space-y-4">
                {leaderboard.length > 0 ? (
                    leaderboard.map((creator: any, index: number) => (
                        <div key={creator.id} className={`p-4 rounded-xl flex items-center justify-between border ${index === 0 ? 'bg-yellow-50 border-yellow-200' : index === 1 ? 'bg-gray-50 border-gray-200' : index === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-200 text-yellow-800' : index === 1 ? 'bg-gray-200 text-gray-800' : index === 2 ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                                    #{index + 1}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{creator.name || 'Anonymous'}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-500">Rep: {creator.reputation_score}</span>
                                        {creator.trust_tier === 'HIGH_TRUST' && (
                                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">PRO</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-green-600">${creator.total_earnings.toFixed(2)}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 italic text-center py-4">No creators on the leaderboard yet.</p>
                )}
                </div>
            </div>
        </div>
      </div>

    </div>
  )
}
