import React from "react"
import { useState } from "react"
import { fetchPromptPreview } from "../../../api/ai/marketCommentaryApi"
import { PromptPreviewResponse } from "../types"

export const usePromptPreview = () => {
  const [data, setData] = useState<PromptPreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPreview = async (
    symbol: string,
    lookback = 5
  ) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchPromptPreview({ symbol, lookback })
      setData(res)
    } catch (e) {
      setError("Failed to load prompt preview")
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    loadPreview
  }
}