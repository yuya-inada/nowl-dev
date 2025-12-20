export interface PromptPreviewResponse {
  template_id: number
  template_name: string
  template_version: string
  rendered_prompt: string
  context: {
    symbol: string
    date_range: string
    price_summary: string
    supply_demand_summary: string
    event_summary: string
  }
  debug: {
    bias: MarketBias
    price?: unknown
    flow?: unknown
    event?: unknown
  }
}

export interface MarketBias {
  trend: "bullish" | "bearish" | "neutral"
  volatility: "low" | "medium" | "high"
  stance: "risk_on" | "risk_off" | "neutral"
  confidence?: number
}