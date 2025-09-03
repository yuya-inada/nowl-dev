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
    "N225",
    "TOPIX",
    "日経先物(Large)",
    "日経先物(Mini)",
    "日経先物(CME:USD)",
    "日経先物(CME:Yen)",
    "USD/JPY",
    "USD/EUR",
    "EUR/USD",
    "NYダウ",
    "S&P500",
    "NASDAQ",
    "BTC/USD",
    "日長期金利",
    "米長期金利",
    "10年期待インフレ率",
    "実質金利",
  ];

  const [selectedChartIndices, setSelectedChartIndices] = useState([
    "N225",
    "日経先物(Large)",
    "日経先物(Mini)",
    "日経先物(CME:USD)",
    "日経先物(CME:Yen)",
  ]);
  const periods = ["1M", "3M", "6M", "1Y", "5Y"];
  const [chartPeriod, setChartPeriod] = useState("1M");
  const [limit, setLimit] = useState(100);
  const [candlesMap, setCandlesMap] = useState({});

  const colors = {
    "日経先物(Large)": "#D4B08C",
    "日経先物(Mini)": "#8BC34A",
    "日経先物(CME:USD)": "#03A9F4",
    "日経先物(CME:Yen)": "#FF5722",
    N225: "gray",
    TOPIX: "#FFC107",
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
      case "1M":
        fromDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "3M":
        fromDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case "6M":
        fromDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case "1Y":
        fromDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case "5Y":
        fromDate = new Date(now.setFullYear(now.getFullYear() - 5));
        break;
      default:
        fromDate = new Date(0);
    }

    Promise.all(
      selectedChartIndices.map((symbol) =>
        fetch(
          `http://localhost:8081/market-index-candles?symbol=${symbol}&from=${fromDate.toISOString()}&limit=${limit}`
        )
          .then((res) => res.json())
          .then((data) => ({ symbol, data: Array.isArray(data) ? data : [] }))
      )
    )
      .then((results) => {
        const newMap = {};
        results.forEach(({ symbol, data }) => {
          newMap[symbol] = data;
        });
        setCandlesMap(newMap);
      })
      .catch((err) => {
        console.error(err);
        setCandlesMap({});
      });
  }, [chartPeriod, limit, selectedChartIndices]);

  const chartData = {
    labels: candlesMap[selectedChartIndices[0]]?.map((c) => c.timestamp) ?? [],
    datasets: selectedChartIndices.map((symbol) => {
      const rawData = candlesMap[symbol]?.map((c) => c.close) ?? [];
      const base = rawData.length > 0 ? rawData[0] : 1;
      const data = rawData.map((v) => (base !== 0 ? v / base : 0));
      return {
        label: symbol,
        data,
        borderColor: colors[symbol] || "#ccc",
        fill: false,
        tension: 0.1,
        yAxisID: "y",
      };
    }),
  };
  
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const symbol = context.dataset.label;
            const index = context.dataIndex;
            const rawValue = candlesMap[symbol]?.[index]?.close ?? 0; // ← 元の株価
            return `${symbol}: ${rawValue}`; // 実際の数値を表示
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        ticks: { color: "#8A7A6A" },
      },
    },
  };

  return (
    <div className="pt-24 p-4 space-y-4">
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
        {/* ヘッダー */}
        <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide">
            COMPOSITE CHART ANALYSIS
          </h2>
          <div className="flex space-x-1">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  chartPeriod === period
                    ? "bg-[#8B4513] text-[#D4B08C] font-semibold"
                    : "bg-[#4A4A4A] text-[#8A7A6A] hover:bg-[#5A5A5A]"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* チェックボックス */}
        <div className="bg-[#3A3A3A] px-4 py-3 border-b border-[#4A4A4A]">
          <div className="grid grid-cols-6 gap-3">
            {chartIndices.map((index) => (
              <label key={index} className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedChartIndices.includes(index)}
                  onChange={() => handleChartIndexChange(index)}
                  className="w-3 h-3 text-[#8B4513] bg-[#2A2A2A] border-[#4A4A4A] rounded focus:ring-[#8B4513]"
                />
                <span className="text-[#D4B08C] whitespace-nowrap">{index}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 線チャート */}
        {/* 凡例を外に描画 */}
        <div className="flex flex-wrap gap-3 px-4 py-2">
          {selectedChartIndices.map((symbol) => (
            <div key={symbol} className="flex items-center space-x-2">
              {/* 丸い色アイコン */}
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[symbol] || "#ccc" }}
              />
              <span className="text-xs text-[#D4B08C]">{symbol}</span>
            </div>
          ))}
        </div>

        {/* 線チャート */}
        <div className="bg-[#1C1C1C] p-2 border border-[#3A3A3A]">
          {Object.keys(candlesMap).length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="text-[#8A7A6A] text-center mt-24">
              データが存在しません
            </div>
          )}
        </div>

        {/* 件数選択 */}
        <div className="bg-[#3A3A3A] px-4 py-2 border-t border-[#4A4A4A]">
          <label className="text-[#8A7A6A] mr-2">表示件数:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-[#1C1C1C] text-[#8A7A6A] border border-gray-700 rounded px-2 py-1 text-xs"
          >
            <option value={20}>直近 20 件</option>
            <option value={50}>直近 50 件</option>
            <option value={100}>直近 100 件</option>
            <option value={200}>直近 200 件</option>
          </select>
        </div>

        {/* データテーブル（シンボルごとに分ける） */}
        <div className="bg-[#1C1C1C] p-2 border-t border-[#3A3A3A] max-h-96 overflow-auto">
          {Object.entries(candlesMap).map(([symbol, candles]) => (
            <div key={symbol} className="mb-6">
              <h3 className="text-[#D4B08C] text-xs font-bold mb-2">{symbol}</h3>
              {candles.length > 0 ? (
                <table className="w-full text-sm text-[#8A7A6A]">
                  <thead className="bg-[#2A2A2A] sticky top-0">
                    <tr>
                      <th>Timestamp</th>
                      <th>Open</th>
                      <th>High</th>
                      <th>Low</th>
                      <th>Close</th>
                      <th>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candles.map((c) => (
                      <tr key={c.timestamp} className="even:bg-[#1A1A1A]">
                        <td>{c.timestamp}</td>
                        <td>{c.open}</td>
                        <td>{c.high}</td>
                        <td>{c.low}</td>
                        <td>{c.close}</td>
                        <td>{c.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-[#8A7A6A] text-center py-4">
                  データが存在しません
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}