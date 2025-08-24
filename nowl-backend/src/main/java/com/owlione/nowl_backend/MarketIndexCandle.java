package com.owlione.nowl_backend;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "market_index_candles")
public class MarketIndexCandle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String symbol;        // NIKKEI225 など
    private String marketType;    // N225 など

    private LocalDateTime timestamp; // ロウソク足の時間（例: 2025-08-24 09:01）

    private BigDecimal open;
    private BigDecimal high;
    private BigDecimal low;
    private BigDecimal close;
    private Long volume;

    private LocalDateTime createdAt = LocalDateTime.now();

    // --- Getter / Setter ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getMarketType() { return marketType; }
    public void setMarketType(String marketType) { this.marketType = marketType; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public BigDecimal getOpen() { return open; }
    public void setOpen(BigDecimal open) { this.open = open; }

    public BigDecimal getHigh() { return high; }
    public void setHigh(BigDecimal high) { this.high = high; }

    public BigDecimal getLow() { return low; }
    public void setLow(BigDecimal low) { this.low = low; }

    public BigDecimal getClose() { return close; }
    public void setClose(BigDecimal close) { this.close = close; }

    public Long getVolume() { return volume; }
    public void setVolume(Long volume) { this.volume = volume; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}