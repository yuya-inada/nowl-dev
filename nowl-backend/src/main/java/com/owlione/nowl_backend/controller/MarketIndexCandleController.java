package com.owlione.nowl_backend.controller;

import com.owlione.nowl_backend.MarketIndexCandle;
import com.owlione.nowl_backend.service.MarketIndexCandleService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/market-index-candles")
public class MarketIndexCandleController {

    private final MarketIndexCandleService candleService;

    public MarketIndexCandleController(MarketIndexCandleService candleService) {
        this.candleService = candleService;
    }

    // 保存（PythonからPOST）
    @PostMapping
    public MarketIndexCandle saveCandle(@RequestBody MarketIndexCandle candle) {
        return candleService.saveCandle(candle);
    }

    // 最新1件取得
    @GetMapping("/latest")
    public MarketIndexCandle getLatestCandle(
            @RequestParam String symbol,
            @RequestParam String marketType
    ) {
        return candleService.getLatestCandle(symbol, marketType);
    }

    // 期間指定で取得
    @GetMapping("/history")
    public List<MarketIndexCandle> getCandles(
            @RequestParam String symbol,
            @RequestParam String marketType,
            @RequestParam String start,
            @RequestParam String end
    ) {
        LocalDateTime startTime = LocalDateTime.parse(start);
        LocalDateTime endTime = LocalDateTime.parse(end);
        return candleService.getCandles(symbol, marketType, startTime, endTime);
    }
}