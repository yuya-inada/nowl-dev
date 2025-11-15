import { useEffect, useState } from "react";

export default function InvestorFlowLogs() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetch("/api/admin/investor-flow/logs", {
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => setLogs(data));
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">投資主体別売買動向ログ</h1>

            <table className="table-auto border-collapse border border-gray-400 w-full">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border px-2 py-1">日時</th>
                        <th className="border px-2 py-1">ステータス</th>
                        <th className="border px-2 py-1">PDF</th>
                        <th className="border px-2 py-1">抽出テーブル数</th>
                        <th className="border px-2 py-1">主体数</th>
                        <th className="border px-2 py-1">メッセージ</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} className="border">
                            <td className="border px-2 py-1">{log.run_at}</td>
                            <td className="border px-2 py-1">{log.status}</td>
                            <td className="border px-2 py-1">{log.pdf_url}</td>
                            <td className="border px-2 py-1">{log.table_count}</td>
                            <td className="border px-2 py-1">{log.record_count}</td>
                            <td className="border px-2 py-1">{log.message}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}