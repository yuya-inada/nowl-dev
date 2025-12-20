import React from "react"
import { useEffect } from "react"
import { usePromptPreview } from "../hooks/usePromptPreview"
import { PromptTextView } from "./PromptTextView"
import { BiasSummaryView } from "./BiasSummaryView"

export const PromptPreviewPanel = () => {
  const {
    data,
    loading,
    error,
    loadPreview
  } = usePromptPreview()

  useEffect(() => {
    loadPreview("NIKKEI225", 5)
  }, [])

  if (loading) return <div>Loading prompt...</div>
  if (error) return <div>{error}</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      <BiasSummaryView bias={data.debug.bias} />
      <PromptTextView prompt={data.rendered_prompt} />
    </div>
  )
}