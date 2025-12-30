import React from "react"
import axios from "axios"
import { PromptPreviewResponse } from "../../features/nowl-ai/types"

export const fetchPromptPreview = async (params: {
  symbol: string
  lookback?: number
}): Promise<PromptPreviewResponse> => {
  const res = await axios.get(
    "/api/ai/market-commentary/prompt-preview",
    { params }
  )
  return res.data
}