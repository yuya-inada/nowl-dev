// src/api/economicEvents.ts
export interface EconomicEvent {
  event_date: string;
  country_code: string;
  event_name: string;
  statement_pdf_url?: string | null;
  press_conf_url?: string | null;
  minutes_pdf_url?: string | null;
  projection_pdf_url?: string | null;
  text_content?: string | null;
  description?: string | null;
}

// 実際にAPIから取得
export async function fetchEconomicEvents(): Promise<EconomicEvent[]> {
  const res = await fetch("http://localhost:8081/api/economic-events"); // FastAPI 側のURLに合わせる
  if (!res.ok) throw new Error("Failed to fetch economic events");
  return res.json();
}