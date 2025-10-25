// src/api/economicEvents.ts
// src/api/economicEvents.ts
export interface EconomicEvent {
  id: number;
  event_date: string;          // 'YYYY-MM-DD'
  country_code: string;        // 'US' など
  event_name: string;          // 'FOMC' など
  description?: string;        // Statement; Press Conference; ...
  created_at?: string;         // DB 登録日時
  statement_pdf_url?: string;
  press_conf_url?: string;
  minutes_pdf_url?: string;
  projection_pdf_url?: string;
  text_content?: string;
  text_extracted?: string;
}

// 実際にAPIから取得
export async function fetchEconomicEvents(): Promise<EconomicEvent[]> {
  const res = await fetch("http://localhost:8081/api/economic-events"); // FastAPI 側のURLに合わせる
  if (!res.ok) throw new Error("Failed to fetch economic events");
  return res.json();
}