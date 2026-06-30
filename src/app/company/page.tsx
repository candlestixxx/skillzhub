/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#EF4444', '#8B5CF6'];

export default function CompanyDashboard() {
  const router = useRouter()
  const [missions, setMissions] = useState([])
  const [datasets, setDatasets] = useState([])
  const [apiKeys, setApiKeys] = useState([])

  // Analytics State
  const [analytics, setAnalytics] = useState<any>({ datasetDurations: [], statusCounts: [], totalSpend: 0 })

  const [, setLoading] = useState(false)

  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")

  const [keyName, setKeyName] = useState("")

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [dsRes, mRes, keysRes, analyticsRes] = await Promise.all([
          fetch('/api/v1/company/datasets'),
          fetch('/api/v1/missions'),
          fetch('/api/v1/company/api-keys'),
          fetch('/api/v1/company/analytics')
      ]);

      if (dsRes.status === 401 || dsRes.status === 403) {
          router.push('/api/auth/signin')
          return;
      }

      if (dsRes.ok) setDatasets(await dsRes.json())
      if (mRes.ok) setMissions(await mRes.json())
      if (keysRes.ok) setApiKeys(await keysRes.json())
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json())

    } catch (e) {
        console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
     // eslint-disable-next-line react-hooks/set-state-in-effect
     fetchDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/v1/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, price_per_minute: parseFloat(price),
          task_type: "manipulation", environment_type: "any",
          license_type: "EXCLUSIVE",
          webhook_url: webhookUrl || undefined,
          webhook_secret: webhookSecret || undefined
        })
      })
      if (res.ok) {
        setFormOpen(false)
        fetchDashboardData()
      }
    } catch {}
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/v1/company/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName || 'New Key' })
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Your new API key is: ${data.key}\nPlease save it now, you won't be able to see it again!`)
        setKeyName("")
        fetchDashboardData()
      }
    } catch {}
  }

  const handleDeleteKey = async (id: string) => {
      try {
          const res = await fetch(`/api/v1/company/api-keys/${id}`, { method: 'DELETE' })
          if (res.ok) {
              fetchDashboardData()
          }
      } catch {}
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Company Dashboard</h1>
          <p className="text-gray-600">Manage your data acquisition pipeline, datasets, and API access.</p>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Dataset Volumes (Seconds)</h2>
              <div className="h-64 w-full">
                {analytics.datasetDurations?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.datasetDurations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                            <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="duration" fill="#6366F1" radius={[4, 4, 0, 0]} name="Duration (s)" maxBarSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm italic border-dashed border-2 border-gray-100 rounded-lg bg-gray-50">
                        No volume data to chart yet.
                    </div>
                )}
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">Mission Pipeline</h2>

              <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Capital Deployed</p>
                  <p className="text-3xl font-bold text-gray-900">${analytics.totalSpend?.toFixed(2) || '0.00'}</p>
              </div>

              <div className="flex-1 min-h-[200px]">
                {analytics.statusCounts?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={analytics.statusCounts}
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {analytics.statusCounts.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm italic border-dashed border-2 border-gray-100 rounded-lg bg-gray-50">
                        No submissions received yet.
                    </div>
                )}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Missions List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Active Missions</h2>
                    <button onClick={() => setFormOpen(!formOpen)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
                        {formOpen ? 'Cancel' : 'Create Mission'}
                    </button>
                </div>

                {formOpen && (
                <form onSubmit={handleCreateMission} className="mb-6 p-5 border border-blue-100 rounded-lg bg-blue-50/50 shadow-inner">
                    <div className="space-y-3">
                        <input type="text" placeholder="Mission Title" value={title} onChange={e=>setTitle(e.target.value)} className="block w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                        <textarea placeholder="Description of the footage needed..." value={description} onChange={e=>setDescription(e.target.value)} className="block w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[80px]" required />
                        <input type="url" placeholder="Webhook URL (Optional)" value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)} className="block w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                        <input type="password" placeholder="Webhook Secret (Optional)" value={webhookSecret} onChange={e=>setWebhookSecret(e.target.value)} className="block w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                            <input type="number" step="0.01" placeholder="Price per minute" value={price} onChange={e=>setPrice(e.target.value)} className="block w-full border border-gray-200 p-2.5 pl-7 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm w-full font-medium hover:bg-blue-700 shadow-sm transition">Publish Mission</button>
                    </div>
                </form>
                )}

                <div className="space-y-3">
                {missions.length > 0 ? (
                    missions.map((m: any) => (
                        <div key={m.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition flex justify-between items-center group">
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{m.title}</h3>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                    <span className="font-medium text-green-600">${m.price_per_minute}/min</span>
                                    <span>&bull;</span>
                                    <span>{new Date(m.created_at).toLocaleDateString()}</span>
                                </p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${m.status === 'OPEN' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                {m.status}
                            </span>
                        </div>
                    ))
                ) : <p className="text-sm text-gray-500 italic text-center py-4">No missions created yet.</p>}
                </div>
            </div>

            {/* API Keys */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Developer API Keys</h2>
                <form onSubmit={handleCreateKey} className="flex gap-2 mb-6">
                    <input type="text" placeholder="e.g. Production Pipeline Key" value={keyName} onChange={e=>setKeyName(e.target.value)} className="flex-1 border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-gray-800 outline-none" required/>
                    <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition shadow-sm whitespace-nowrap">Generate Key</button>
                </form>
                <div className="space-y-2">
                {apiKeys.length > 0 ? (
                    apiKeys.map((k: any) => (
                        <div key={k.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-lg group hover:border-gray-300 transition">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{k.name}</p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {k.id.substring(0, 8)}...</p>
                            </div>
                            <button onClick={() => handleDeleteKey(k.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 text-sm font-medium px-3 py-1.5 rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100">Revoke</button>
                        </div>
                    ))
                ) : <p className="text-sm text-gray-500 italic text-center py-4">No active API keys.</p>}
                </div>
            </div>
          </div>

          <div>
            {/* Datasets */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Your Datasets</h2>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{datasets.length} Total</span>
                </div>

                <div className="space-y-4">
                {datasets.length > 0 ? (
                    datasets.map((d: any) => (
                        <div key={d.id} className="border border-gray-200 p-5 rounded-xl hover:shadow-md transition bg-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg text-gray-900 leading-tight pr-16">{d.title}</h3>
                                <span className="absolute top-5 right-5 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">{d.status}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-5 line-clamp-2">{d.description}</p>

                            <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Total Duration</p>
                                    <p className="font-mono text-sm text-gray-900">{d.total_duration_seconds}s</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Video Samples</p>
                                    <p className="font-mono text-sm text-gray-900">{d._count?.dataset_samples || 0}</p>
                                </div>
                            </div>

                            <button onClick={() => window.location.href=`/api/v1/datasets/${d.id}/manifest`} className="w-full bg-white border-2 border-purple-600 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition shadow-sm flex justify-center items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Download JSON Manifest
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        </div>
                        <p className="text-gray-900 font-medium mb-1">No datasets compiled yet</p>
                        <p className="text-gray-500 text-sm">Accept creator submissions via the Admin portal to automatically generate datasets here.</p>
                    </div>
                )}
                </div>
            </div>
          </div>
      </div>
    </div>
  )
}
