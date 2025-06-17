"use client"

import React from "react"
import OperatorRankings from "@/components/operadores/operator-rankings"
import { Metadata } from "next"

export default function RankingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OperatorRankings />
    </div>
  )
}
