"use client";
import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

function toDateOnly(d){ const x = new Date(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate()); }

export default function AvailabilityPage(){
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [range, setRange] = useState({ from: undefined, to: undefined });

  useEffect(()=>{ fetch("/api/admin/properties").then(r=>r.json()).then(setProperties); },[]);
  useEffect(()=>{
    if (!propertyId) return setBookings([]);
    fetch(`/api/bookings?propertyId=${propertyId}`).then(r=>r.json()).then(setBookings);
  },[propertyId]);
  const bookedDays = useMemo(
    () =>
      bookings.flatMap((b) => {
        const days = [];
        const s = toDateOnly(b.startDate);
        const e = toDateOnly(b.endDate); // Ende exkl.
  
        for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d));
        }
        return days;
      }),
    [bookings]
  );
  
  

  async function add(){
    if (!range.from || !range.to) return;
    const arrival = range.from.toISOString().slice(0,10);
    const departure = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate()+1).toISOString().slice(0,10); // Ende exkl.
    const res = await fetch("/api/bookings",{ method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ propertyId:Number(propertyId), arrival, departure, guestName:"(Admin)" }) });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Fehler");
    const fresh = await fetch(`/api/bookings?propertyId=${propertyId}`).then(r=>r.json());
    setBookings(fresh);
    setRange({ from: undefined, to: undefined });
  }
  async function remove(id){
    if (!confirm("Buchung löschen?")) return;
    await fetch(`/api/admin/booking/${id}`,{ method:"DELETE" });
    setBookings(bookings.filter(b=>b.id!==id));
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Verfügbarkeiten</h1>

      <div className="mb-4">
        <select className="border rounded-xl px-3 py-2" value={propertyId} onChange={e=>setPropertyId(e.target.value)}>
          <option value="">— Objekt wählen —</option>
          {properties.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {propertyId && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl ring-1 ring-black/5 p-4">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              showOutsideDays
              modifiers={{ booked: bookedDays }}
              modifiersStyles={{ booked: { backgroundColor:"#ef4444", color:"#fff", borderRadius:6 } }}
            />
            <div className="mt-3 flex items-center gap-3">
              <button className="rounded-xl px-4 py-2 bg-sky-600 text-white" onClick={add}>Blockieren / Buchen</button>
              <span className="text-xs text-slate-500">Tipp: Bereich wählen, dann speichern. Bestehende Blöcke in der Liste löschen.</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl ring-1 ring-black/5 p-4">
            <h3 className="font-semibold mb-2">Buchungen</h3>
            {bookings.length===0 ? <p className="text-sm text-slate-500">Keine Einträge.</p> : (
              <ul className="text-sm space-y-2">
        {bookings.map((b) => (
  <li
    key={b.id}
    className="flex items-center justify-between border-b py-2"
  >
    <span>
      {b.startDate.slice(0, 10)} → {b.endDate.slice(0, 10)} (exkl.)
      {b.guestName ? ` · ${b.guestName}` : ""}
    </span>
    <button
      className="text-rose-700"
      onClick={() => remove(b.id)}
    >
      Löschen
    </button>
  </li>
))}

              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
