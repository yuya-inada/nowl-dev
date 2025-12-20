import React from "react"

export const PromptTextView = ({ prompt }: { prompt: string }) => {
  return (
    <div>
      <h3 className="font-bold mb-2">Rendered Prompt (LLM Input)</h3>
      <pre className="whitespace-pre-wrap text-sm bg-black text-green-200 p-4 rounded">
        {prompt}
      </pre>
    </div>
  )
}