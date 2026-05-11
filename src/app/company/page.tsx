"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CompanyDashboard() {
  const [datasets, setDatasets] = useState([])
  const [missions, setMissions] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("1.50")
  const [keyName, setKeyName] = useState("")

  const fetchDatasets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/company/datasets')
      if (res.ok) setDatasets(await res.json())
    } catch (e) {}
    setLoading(false)
  }

  const fetchMissions = async () => {
    try {
      const res = await fetch('/api/v1/missions')
      if (res.ok) setMissions(await res.json())
    } catch (e) {}
  }

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/v1/company/api-keys')
      if (res.ok) setApiKeys(await res.json())
    } catch (e) {}
  }

  useEffect(() => {
     fetchMissions()
     fetchApiKeys()
     fetchDatasets()
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
          license_type: "EXCLUSIVE"
        })
      })
      if (res.ok) {
        setFormOpen(false)
        fetchMissions()
      }
    } catch (e) {}
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
        fetchApiKeys()
      }
    } catch (e) {}
  }

  const handleDeleteKey = async (id: string) => {
      try {
          const res = await fetch(`/api/v1/company/api-keys/${id}`, { method: 'DELETE' })
          if (res.ok) {
              fetchApiKeys()
          }
      } catch (e) {}
  }

  // Analytics preparation
  const chartData = datasets.map((d: any) => ({
      name: d.title.substring(0, 15) + '...',
      duration: d.total_duration_seconds
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Company Dashboard</h1>
      <p className="text-gray-600 mb-8">Manage your data acquisition pipeline, datasets, and API access.</p>

      {/* Analytics Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Dataset Volumes (Seconds)</h2>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="duration" fill="#8884d8" name="Duration (s)" />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500 italic border-dashed border-2 border-gray-200 rounded">
                    No data to chart yet. Accept submissions to build datasets.
                </div>
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Your Missions</h2>
                    <button onClick={() => setFormOpen(!formOpen)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition">
                        {formOpen ? 'Cancel' : '+ Create Mission'}
                    </button>
                </div>

                {formOpen && (
                <form onSubmit={handleCreateMission} className="mb-4 p-4 border border-blue-100 rounded bg-blue-50">
                    <input type="text" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} className="block w-full border border-gray-300 p-2 mb-2 rounded" required />
                    <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className="block w-full border border-gray-300 p-2 mb-2 rounded" required />
                    <input type="number" step="0.01" placeholder="Price per minute" value={price} onChange={e=>setPrice(e.target.value)} className="block w-full border border-gray-300 p-2 mb-2 rounded" required />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm w-full font-medium hover:bg-blue-700">Submit Mission</button>
                </form>
                )}

                <button onClick={fetchMissions} className="mb-4 text-blue-600 text-sm font-medium hover:underline">Refresh Missions</button>

                <div className="space-y-3">
                {missions.length > 0 ? (
                    missions.map((m: any) => (
                        <div key={m.id} className="p-3 border border-gray-100 rounded bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">{m.title}</h3>
                                <p className="text-xs text-gray-500">${m.price_per_minute}/min</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${m.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                {m.status}
                            </span>
                        </div>
                    ))
                ) : <p className="text-sm text-gray-500 italic">No missions loaded.</p>}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
                <h2 className="text-xl font-semibold mb-4">API Keys</h2>
                <form onSubmit={handleCreateKey} className="flex gap-2 mb-4">
                    <input type="text" placeholder="Key name..." value={keyName} onChange={e=>setKeyName(e.target.value)} className="flex-1 border border-gray-300 px-3 py-1.5 rounded text-sm" required/>
                    <button type="submit" className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-black transition">Generate Key</button>
                </form>
                <div className="space-y-2">
                {apiKeys.length > 0 ? (
                    apiKeys.map((k: any) => (
                        <div key={k.id} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-100 rounded">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{k.name}</p>
                                <p className="text-xs text-gray-400 font-mono">ID: {k.id.substring(0, 8)}...</p>
                            </div>
                            <button onClick={() => handleDeleteKey(k.id)} className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1">Revoke</button>
                        </div>
                    ))
                ) : <p className="text-sm text-gray-500 italic">No active API keys.</p>}
                </div>
            </div>
          </div>

          <div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Your Datasets</h2>
                    <button onClick={fetchDatasets} disabled={loading} className="text-blue-600 text-sm font-medium hover:underline disabled:opacity-50">
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                <div className="space-y-4">
                {datasets.length > 0 ? (
                    datasets.map((d: any) => (
                        <div key={d.id} className="border border-gray-200 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-900">{d.title}</h3>
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">{d.status}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{d.description}</p>
                            <div className="flex gap-4 text-sm text-gray-500 mb-4">
                                <p><strong>Duration:</strong> {d.total_duration_seconds}s</p>
                                <p><strong>Samples:</strong> {d._count?.dataset_samples || 0}</p>
                            </div>
                            <button onClick={() => window.location.href=`/api/v1/datasets/${d.id}/manifest`} className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 transition">
                                Download Manifest (JSON)
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-sm mb-2">No datasets found.</p>
                        <p className="text-gray-400 text-xs">Accept submissions via the Admin portal to generate datasets.</p>
                    </div>
                )}
                </div>
            </div>
          </div>
      </div>
    </div>
  )
}
