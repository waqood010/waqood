"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"

interface FuelType { id: number; name: string; tonToLiter: number }
interface Tank { id: number; name: string; fuelTypeId: number; currentBalance: number; capacityLiter: number; fuelType: FuelType; stationId: number; minAlertLevel: number }
interface Station { id: number; name: string }

interface StationTankSelectorProps {
  stations: Station[]
  allTanks: Tank[]
  // controlled
  selectedStationId: number | null
  selectedTankId: number | null
  onStationChange: (id: number | null) => void
  onTankChange: (id: number | null) => void
  onTankDataChange?: (tank: Tank | null) => void
}

export function StationTankSelector({
  stations,
  allTanks,
  selectedStationId,
  selectedTankId,
  onStationChange,
  onTankChange,
  onTankDataChange,
}: StationTankSelectorProps) {
  const filteredTanks = selectedStationId
    ? allTanks.filter((t) => t.stationId === selectedStationId)
    : []

  // When station changes, reset tank
  function handleStationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value ? Number(e.target.value) : null
    onStationChange(id)
    onTankChange(null)
    onTankDataChange?.(null)
  }

  function handleTankChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value ? Number(e.target.value) : null
    onTankChange(id)
    const tank = allTanks.find((t) => t.id === id) ?? null
    onTankDataChange?.(tank)
  }

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>المحطة</Label>
        <select
          className={selectClass}
          value={selectedStationId ?? ""}
          onChange={handleStationChange}
          required
        >
          <option value="">-- اختر المحطة --</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>الخزان</Label>
        <select
          className={selectClass}
          value={selectedTankId ?? ""}
          onChange={handleTankChange}
          required
          disabled={!selectedStationId || filteredTanks.length === 0}
        >
          <option value="">
            {!selectedStationId
              ? "اختر المحطة أولاً"
              : filteredTanks.length === 0
                ? "لا يوجد خزانات لهذه المحطة"
                : "-- اختر الخزان --"}
          </option>
          {filteredTanks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.fuelType.name})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Re-export Tank type for consumers
export type { Tank, Station, FuelType }
