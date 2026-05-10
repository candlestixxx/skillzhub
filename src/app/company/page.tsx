"use client"
import { useState, useEffect } from "react"

export default function CompanyDashboard() {
  const [datasets, setDatasets] = useState([])
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("1.50")

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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Company Dashboard</h1>
      <p>Data Acquisition Portal</p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Missions</h2>
        <button onClick={() => setFormOpen(!formOpen)} className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
             + Create New Mission
        </button>
        {formOpen && (
          <form onSubmit={handleCreateMission} className="mb-4 p-4 border rounded bg-white max-w-lg">
            <input type="text" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} className="block w-full border p-2 mb-2" required />
            <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className="block w-full border p-2 mb-2" required />
            <input type="number" step="0.01" placeholder="Price per minute" value={price} onChange={e=>setPrice(e.target.value)} className="block w-full border p-2 mb-2" required />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
          </form>
        )}
        <button onClick={fetchMissions} className="mb-4 ml-2 bg-blue-500 text-white px-4 py-2 rounded">Load Missions</button>
        <div className="bg-gray-100 p-4 rounded-lg">
          {missions.length > 0 ? (
             <ul className="space-y-2">
               {missions.map((m: any) => (
                 <li key={m.id} className="bg-white p-2 rounded shadow">{m.title} - {m.status} - ${m.price_per_minute}/min</li>
               ))}
             </ul>
          ) : <p className="text-gray-600 italic">No missions loaded.</p>}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Datasets</h2>
        <button onClick={fetchDatasets} disabled={loading} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition disabled:opacity-50">
             {loading ? 'Loading...' : 'Load Datasets'}
        </button>
        <div className="bg-gray-100 p-4 rounded-lg">
          {datasets.length > 0 ? (
            <ul className="space-y-4">
              {datasets.map((d: any) => (
                <li key={d.id} className="bg-white p-4 rounded shadow">
                   <h3 className="font-bold">{d.title}</h3>
                   <p className="text-sm text-gray-600">{d.description}</p>
                   <p className="text-sm font-semibold mt-2">Duration: {d.total_duration_seconds}s | Status: {d.status}</p>
                   <button onClick={() => window.location.href=`/api/v1/datasets/${d.id}/manifest`} className="mt-2 bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">Download Manifest</button>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-gray-600 italic">No datasets loaded.</p>
          )}
        </div>
      </div>
    </div>
  )
}
