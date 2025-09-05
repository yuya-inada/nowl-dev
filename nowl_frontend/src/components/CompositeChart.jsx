import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function CompositeChart() {
  const chartIndices = [
    "N225", "TOPIX", "日経先物(Large)", "日経先物(Mini)",
    "日経先物(CME:USD)", "日経先物(CME:Yen)", "USD/JPY", "USD/EUR",
    "NYダウ", "S&P500", "NASDAQ", "BTC/USD",
    "日長期金利", "米長期金利", "10年期待インフレ率", "実質金利",
  ];

  const symbolMapping = {
    "S&P500": "^GSPC",
    "NYダウ": "^DJI",
    "NASDAQ": "^IXIC",
    "N225": "^N225",
    "USD/JPY": "JPY=X",
    "EUR/USD": "EURUSD=X",
    "USD/EUR": "EURUSD=X",
    "BTC/USD": "BTC-USD",
  };

  const displayNameMapping = {
    "N225": "日経平均株価",
    "TOPIX": "TOPIX",
    "S&P500": "S&P500",
    "NYダウ": "NYダウ",
    "NASDAQ": "NASDAQ",
    "USD/JPY": "ドル/円",
    "USD/EUR": "ドル/ユーロ",
    "BTC/USD": "ビットコイン",
  };

  const [selectedChartIndices, setSelectedChartIndices] = useState(["N225"]);
  const periods = ["1M", "3M", "6M", "1Y", "5Y"];
  const [chartPeriod, setChartPeriod] = useState("1M");
  const timeframes = ["1m","2m","3m","4m","5m","10m","15m","30m","60m","1d","1w","1M"];
  const [selectedTimeframe, setSelectedTimeframe] = useState("1d");
  const [candlesMap, setCandlesMap] = useState({});

  const colors = {
    N225: "#FF8C00", TOPIX: "#FFA500",
    "日経先物(Large)": "#D2691E", "日経先物(Mini)": "#CD853F",
    "日経先物(CME:USD)": "#FFB347", "日経先物(CME:Yen)": "#FF7F50",
    "NYダウ": "#1E90FF", "S&P500": "#00BFFF", "NASDAQ": "#87CEFA",
    "USD/JPY": "#228B22", "USD/EUR": "#32CD32", "BTC/USD": "#FFD700",
    "日長期金利": "#FF4500", "米長期金利": "#FF6347",
    "10年期待インフレ率": "#FF1493", "実質金利": "#FF69B4",
  };

  const handleChartIndexChange = (index) => {
    if (selectedChartIndices.includes(index)) {
      setSelectedChartIndices(selectedChartIndices.filter((i) => i !== index));
    } else {
      setSelectedChartIndices([...selectedChartIndices, index]);
    }
  };

  useEffect(() => {
    if (selectedChartIndices.length === 0) {
      setCandlesMap({});
      return;
    }

    const now = new Date();
    let fromDate;
    switch (chartPeriod) {
      case "1M": fromDate = new Date(now.setMonth(now.getMonth() - 1)); break;
      case "3M": fromDate = new Date(now.setMonth(now.getMonth() - 3)); break;
      case "6M": fromDate = new Date(now.setMonth(now.getMonth() - 6)); break;
      case "1Y": fromDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
      case "5Y": fromDate = new Date(now.setFullYear(now.getFullYear() - 5)); break;
      default: fromDate = new Date(0);
    }

    Promise.all(
      selectedChartIndices.map((symbol) => {
        const apiSymbol = symbolMapping[symbol] || symbol;
        const url = `http://localhost:8081/market-index-candles?symbol=${apiSymbol}&from=${fromDate.toISOString()}&interval=${selectedTimeframe}`;
        return fetch(url)
          .then(res => res.json())
          .then(data => ({ symbol, data: Array.isArray(data) ? data : [] }));
      })
    ).then(results => {
      const newMap = {};
      results.forEach(({ symbol, data }) => { newMap[symbol] = data; });
      setCandlesMap(newMap);
    }).catch(err => { console.error(err); setCandlesMap({}); });
  }, [chartPeriod, selectedTimeframe, selectedChartIndices]);

  const lineStyles = {
    N225: { color: "#FF8C00", width: 3, dash: [] },
    TOPIX: { color: "#FFA500", width: 2, dash: [5,3] },
    "日経先物(Large)": { color: "#D2691E", width: 2, dash: [] },
    "日経先物(Mini)": { color: "#CD853F", width: 2, dash: [2,2] },
    "日経先物(CME:USD)": { color: "#FFB347", width: 1.5, dash: [1,2] },
    "日経先物(CME:Yen)": { color: "#FF7F50", width: 1.5, dash: [3,3] },
    "NYダウ": { color: "#1E90FF", width: 3, dash: [] },
    "S&P500": { color: "#00BFFF", width: 2.5, dash: [5,3] },
    "NASDAQ": { color: "#87CEFA", width: 2, dash: [2,2] },
    "USD/JPY": { color: "#228B22", width: 2.5, dash: [] },
    "USD/EUR": { color: "#32CD32", width: 2, dash: [3,3] },
    "BTC/USD": { color: "#FFD700", width: 3, dash: [] },
    "日長期金利": { color: "#FF4500", width: 2, dash: [4,2] },
    "米長期金利": { color: "#FF6347", width: 2, dash: [2,2] },
    "10年期待インフレ率": { color: "#FF1493", width: 2, dash: [1,2] },
    "実質金利": { color: "#FF69B4", width: 2, dash: [5,5] },
  };

  const chartData = {
    labels: candlesMap[selectedChartIndices[0]]?.map(c => c.timestamp) ?? [],
    datasets: selectedChartIndices.map(symbol => {
      const rawData = candlesMap[symbol]?.map(c => c.close) ?? [];
      const base = rawData[0] ?? 1;
      const data = rawData.map(v => base !== 0 ? v/base : 0);
      const style = lineStyles[symbol] || { color: "#ccc", width: 2, dash: [] };
      return {
        label: displayNameMapping[symbol] || symbol,
        data,
        borderColor: style.color,
        borderWidth: style.width,
        borderDash: style.dash,
        fill: false,
        tension: 0.1,
      };
    }),
  };

  const chartOptions = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => {
            const symbol = selectedChartIndices[ctx.datasetIndex];
            const val = candlesMap[symbol]?.[ctx.dataIndex]?.close ?? 0;
            return `${displayNameMapping[symbol]||symbol}: ${val}`;
          },
        },
      },
    },
    scales: {
      y: { type: "linear", display: true, position: "left", ticks: { color: "#8A7A6A" } },
    },
  };

  return (
    <div className="pt-24 p-4 space-y-4">
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
        {/* ヘッダー */}
        <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A] flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
          <h2 className="text-xl font-bold text-[#D4B08C] tracking-wide">COMPOSITE CHART ANALYSIS</h2>
          {/* 期間ボタン */}
          <div className="flex gap-2 flex-wrap">
            {periods.map(p => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`px-3 py-1 rounded font-semibold text-sm transition-colors ${
                  chartPeriod === p
                    ? "bg-[#8B4513] text-[#D4B08C]"
                    : "bg-[#4A4A4A] text-[#8A7A6A] hover:bg-[#5A5A5A]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* 足種ボタン（横スクロール可能） */}
          <div className="flex gap-2 overflow-x-auto py-1">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1 rounded font-semibold text-sm flex-shrink-0 transition-colors ${
                  selectedTimeframe === tf
                    ? "bg-[#1E90FF] text-white"
                    : "bg-[#4A4A4A] text-[#8A7A6A] hover:bg-[#5A5A5A]"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* チェックボックス */}
        <div className="bg-[#3A3A3A] px-4 py-3 border-b border-[#4A4A4A]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {chartIndices.map(index=>(
              <label key={index} className="flex items-center space-x-2 text-xs">
                <input type="checkbox" checked={selectedChartIndices.includes(index)} onChange={()=>handleChartIndexChange(index)} className="w-3 h-3 text-[#8B4513] bg-[#2A2A2A] border-[#4A4A4A] rounded focus:ring-[#8B4513]" />
                <span className="text-[#D4B08C] text-sm whitespace-nowrap">{displayNameMapping[index]||index}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap gap-3 px-4 py-2">
          {selectedChartIndices.map(symbol=>(
            <div key={symbol} className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full" style={{backgroundColor:colors[symbol]||"#ccc"}}/>
              <span className="text-xs text-[#D4B08C]">{displayNameMapping[symbol]||symbol}</span>
            </div>
          ))}
        </div>

        {/* 線チャート */}
        <div className="bg-[#1C1C1C] p-2 border border-[#3A3A3A] h-[400px] md:h-[500px]">
          {Object.keys(candlesMap).length>0 ? <Line data={chartData} options={chartOptions}/> : <div className="text-[#8A7A6A] text-center mt-24">データが存在しません</div>}
        </div>
      </div>
    </div>
  );
}