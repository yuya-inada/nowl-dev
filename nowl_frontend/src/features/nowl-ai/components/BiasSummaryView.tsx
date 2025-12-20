import React from "react"
import { MarketBias } from "../types"

export const BiasSummaryView = ({ bias }: { bias: MarketBias }) => {
  return (
    <div className="border rounded p-4 bg-gray-50">
      <h3 className="font-bold mb-2">Market Bias</h3>
      <ul className="text-sm space-y-1">
        <li>Trend: <b>{bias.trend}</b></li>
        <li>Volatility: <b>{bias.volatility}</b></li>
        <li>Stance: <b>{bias.stance}</b></li>
        {bias.confidence != null && (
          <li>Confidence: <b>{bias.confidence}</b></li>
        )}
      </ul>
    </div>
  )
}