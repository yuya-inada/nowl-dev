package com.owlione.nowl_backend.service;

import com.owlione.nowl_backend.entity.MarketIndexCandle;
import com.owlione.nowl_backend.repository.MarketIndexCandleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MarketIndexCandleService {

    private final MarketIndexCandleRepository repository;

    public MarketIndexCandleService(MarketIndexCandleRepository repository) {
        this.repository = repository;
    }

    // 保存
    public MarketIndexCandle saveCandle(MarketIndexCandle candle) {
        return repository.save(candle);
    }

    // 最新1件
    public MarketIndexCandle getLatestCandle(String symbol, String marketType) {
        return repository.findTopBySymbolAndMarketTypeOrderByTimestampDesc(symbol, marketType);
    }

    // 期間指定取得
    public List<MarketIndexCandle> getCandles(String symbol, String marketType, LocalDateTime start, LocalDateTime end) {
        return repository.findBySymbolAndMarketTypeAndTimestampBetween(symbol, marketType, start, end);
    }
}