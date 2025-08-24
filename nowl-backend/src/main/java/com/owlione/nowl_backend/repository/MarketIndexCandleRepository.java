package com.owlione.nowl_backend.repository;

import com.owlione.nowl_backend.MarketIndexCandle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MarketIndexCandleRepository extends JpaRepository<MarketIndexCandle, Long> {

    // シンボル + 市場タイプ + 時間範囲で取得
    List<MarketIndexCandle> findBySymbolAndMarketTypeAndTimestampBetween(
            String symbol,
            String marketType,
            LocalDateTime start,
            LocalDateTime end
    );

    // 最新のロウソク足1件を取得
    MarketIndexCandle findTopBySymbolAndMarketTypeOrderByTimestampDesc(
            String symbol,
            String marketType
    );
}