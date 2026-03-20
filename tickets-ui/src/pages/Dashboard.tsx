import { useEffect, useState } from "react"
import { api } from "../api/api"

export default function Dashboard() {

  const [data, setData] = useState<any>(null)
  const [mttrData, setMttrData] = useState<any>(null)

  async function load() {
    const res = await api.get("/metrics/dashboard")
    setData(res.data.data)
  }

useEffect(()=>{
  load()
  loadMttr()
},[])

  if (!data) return <div>Loading...</div>

  async function loadMttr() {
  try {
    const res = await api.get("/metrics/mttr?days=7")
    setMttrData(res.data.data)
  } catch (err) {
    console.error(err)
  }
}
{mttrData && (
  <div className="bg-white p-4 rounded shadow">

    <h2 className="text-lg font-semibold mb-2">
      MTTR (Last 7 days)
    </h2>

    {mttrData.map((d:any)=>(
      <div key={d.date} className="flex justify-between text-sm border-b py-1">

        <span>{d.date}</span>
        <span>{Math.round(d.mttr)} min</span>

      </div>
    ))}

  </div>
)}


  return (

    
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">

        <Card title="Total Tickets" value={data.total} />
        <Card title="Open" value={data.openTickets} />
        <Card title="In Progress" value={data.ProgressTickets} />
        <Card title="Closed" value={data.closedTickets} />

      </div>

      <div className="grid grid-cols-2 gap-4">

        <Card title="MTTR (min)" value={data.mttrMinutes} />
        <Card title="MTTR Max" value={data.mttrMinutesMax} />

      </div>

    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div className="bg-white p-4 rounded shadow">

      <div className="text-sm text-gray-500">
        {title}
      </div>

      <div className="text-2xl font-bold">
        {value}
      </div>

    </div>
  )
}