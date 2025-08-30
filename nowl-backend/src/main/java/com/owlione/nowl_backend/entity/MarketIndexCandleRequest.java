package com.owlione.nowl_backend.entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarketIndexCandleRequest {
    private String symbol;     // 例: "S&P500"
    private String timestamp;  // 例: "2025-08-30T21:00:00"
    private Double open;
    private Double high;
    private Double low;
    private Double close;
    private Long volume;
}