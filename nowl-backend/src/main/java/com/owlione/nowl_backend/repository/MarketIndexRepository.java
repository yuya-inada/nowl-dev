package com.owlione.nowl_backend.repository;

import com.owlione.nowl_backend.MarketIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable; 
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketIndexRepository extends JpaRepository<MarketIndex, Long> {
    List<MarketIndex> findByMarketType(String marketType);
    List<MarketIndex> findBySymbolAndMarketTypeOrderByCreatedAtDesc(String symbol, String marketType, Pageable pageable);
    // --- 新規：symbol + marketType で最新レコード取得 ---
    Optional<MarketIndex> findTopBySymbolAndMarketTypeOrderByCreatedAtDesc(String symbol, String marketType);
}