package com.owlione.nowl_backend.service;

import com.owlione.nowl_backend.MarketIndex;
import com.owlione.nowl_backend.repository.MarketIndexRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
public class MarketIndexService {

    private final MarketIndexRepository marketIndexRepository;

    public MarketIndexService(MarketIndexRepository marketIndexRepository) {
        this.marketIndexRepository = marketIndexRepository;
    }

    public List<MarketIndex> getByMarketType(String marketType) {
      return marketIndexRepository.findByMarketType(marketType);
    }

    // 全件取得
    public List<MarketIndex> getAllMarketIndices() {
        return marketIndexRepository.findAll();
    }

    // IDで取得
    public Optional<MarketIndex> getMarketIndexById(Long id) {
        return marketIndexRepository.findById(id);
    }

    // 作成
    public MarketIndex createMarketIndex(MarketIndex marketIndex) {
        return marketIndexRepository.save(marketIndex);
    }

    // 更新
    public MarketIndex updateMarketIndex(Long id, MarketIndex marketIndexDetails) {
        return marketIndexRepository.findById(id).map(marketIndex -> {
            marketIndex.setName(marketIndexDetails.getName());
            marketIndex.setSymbol(marketIndexDetails.getSymbol());
            marketIndex.setCurrentValue(marketIndexDetails.getCurrentValue());
            marketIndex.setChangeValue(marketIndexDetails.getChangeValue());
            marketIndex.setChangePercent(marketIndexDetails.getChangePercent());
            marketIndex.setRegion(marketIndexDetails.getRegion());
            marketIndex.setDisplayOrder(marketIndexDetails.getDisplayOrder());
            marketIndex.setIsActive(marketIndexDetails.getIsActive());
            marketIndex.setLastUpdated(marketIndexDetails.getLastUpdated());
            return marketIndexRepository.save(marketIndex);
        }).orElseThrow(() -> new RuntimeException("MarketIndex not found with id " + id));
    }

    // 削除
    public void deleteMarketIndex(Long id) {
        marketIndexRepository.deleteById(id);
    }

    // --- 新規：履歴として保存 ---
    public MarketIndex saveMarketIndexHistory(
            String name,
            String symbol,
            BigDecimal currentValue,
            BigDecimal changeValue,
            BigDecimal changePercent,
            String region,
            Integer displayOrder,
            Boolean isActive,
            String marketType
    ) {
        MarketIndex mi = new MarketIndex();
        mi.setName(name);
        mi.setSymbol(symbol);
        mi.setCurrentValue(currentValue);
        mi.setChangeValue(changeValue);
        mi.setChangePercent(changePercent);
        mi.setRegion(region);
        mi.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        mi.setIsActive(isActive != null ? isActive : true);
        mi.setMarketType(marketType != null ? marketType : "STOCK");
        mi.setLastUpdated(LocalDateTime.now());

        return marketIndexRepository.save(mi);
    }

    // --- 新規：symbol + marketType で最新履歴取得 ---
    public MarketIndex getLatestBySymbolAndMarketType(String symbol, String marketType) {
        return marketIndexRepository
          .findTopBySymbolAndMarketTypeOrderByCreatedAtDesc(symbol, marketType)
          .orElse(null);
    }

    // 過去 n 件の履歴取得
    public List<MarketIndex> getHistory(String symbol, String marketType, int n) {
      Pageable pageable = PageRequest.of(0, n);
      return marketIndexRepository.findBySymbolAndMarketTypeOrderByCreatedAtDesc(symbol, marketType, pageable);
    }
}