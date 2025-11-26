// src/app/admin/properties/[id]/ExtrasForm.jsx
"use client";
import { useState } from "react";

export default function ExtrasForm({ propertyId, initialExtras }) {
  const [extras, setExtras] = useState(initialExtras || []);

  async function addExtra() {
    setExtras([...extras, { title: "", amount: 0, isDaily: false }]);
  }

  async function save() {
    await fetch(`/api/admin/properties/${propertyId}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(extras),
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Nebenkosten</h3>
      {extras.map((e, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="border p-2 flex-1"
            value={e.title}
            placeholder="z.B. Endreinigung"
            onChange={(ev) => {
              const copy = [...extras];
              copy[idx].title = ev.target.value;
              setExtras(copy);
            }}
          />
          <input
            type="number"
            className="border p-2 w-24"
            value={e.amount}
            onChange={(ev) => {
              const copy = [...extras];
              copy[idx].amount = parseInt(ev.target.value, 10);
              setExtras(copy);
            }}
          />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={e.isDaily}
              onChange={(ev) => {
                const copy = [...extras];
                copy[idx].isDaily = ev.target.checked;
                setExtras(copy);
              }}
            />
            pro Tag
          </label>
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={addExtra} className="btn-secondary">+ Hinzufügen</button>
        <button onClick={save} className="btn-primary">Speichern</button>
      </div>
    </div>
  );
}
