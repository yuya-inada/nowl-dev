package com.owlione.nowl_backend.controller;

import com.owlione.nowl_backend.MarketIndex;
import com.owlione.nowl_backend.service.MarketIndexService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/market-indices")
public class MarketIndexController {

    private final MarketIndexService marketIndexService;

    public MarketIndexController(MarketIndexService marketIndexService) {
        this.marketIndexService = marketIndexService;
    }

    // 全件取得
    @GetMapping
    public List<MarketIndex> getMarketIndices(@RequestParam(required = false) String marketType) {
        if (marketType != null) {
            return marketIndexService.getByMarketType(marketType);
        }
        return marketIndexService.getAllMarketIndices();
    }

    // 履歴として保存
    @PostMapping("/history")
    public MarketIndex saveMarketIndexHistory(@RequestBody MarketIndex request) {
        return marketIndexService.saveMarketIndexHistory(
            request.getName(),
            request.getSymbol(),
            request.getCurrentValue(),
            request.getChangeValue(),
            request.getChangePercent(),
            request.getRegion(),
            request.getDisplayOrder(),
            request.getIsActive(),
            request.getMarketType()
        );
    }

    // ID取得
    @GetMapping("/{id}")
    public MarketIndex getMarketIndexById(@PathVariable Long id) {
        return marketIndexService.getMarketIndexById(id)
                .orElseThrow(() -> new RuntimeException("MarketIndex not found with id " + id));
    }

    // 作成
    @PostMapping
      public MarketIndex createMarketIndex(@RequestBody MarketIndex request) {
        return marketIndexService.createMarketIndex(request);
    }

    // 更新
    @PutMapping("/{id}")
    public MarketIndex updateMarketIndex(@PathVariable Long id, @RequestBody MarketIndex marketIndexDetails) {
        return marketIndexService.updateMarketIndex(id, marketIndexDetails);
    }

    // 削除
    @DeleteMapping("/{id}")
    public String deleteMarketIndex(@PathVariable Long id) {
        marketIndexService.deleteMarketIndex(id);
        return "Deleted market index with id " + id;
    }
}