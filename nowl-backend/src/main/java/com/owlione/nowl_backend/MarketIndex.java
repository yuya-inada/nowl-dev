package com.owlione.nowl_backend;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "market_indices")
public class MarketIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(length = 20, nullable = false)
    private String symbol;

    @Column(name = "current_value", precision = 12, scale = 2, nullable = false)
    private BigDecimal currentValue;

    @Column(name = "change_value", precision = 10, scale = 2, nullable = false)
    private BigDecimal changeValue;

    @Column(name = "change_percent", precision = 6, scale = 2, nullable = false)
    private BigDecimal changePercent;

    @Column(length = 50, nullable = false)
    private String region;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "market_type", nullable = false)
    private String marketType = "STOCK";

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    // DBのDEFAULT CURRENT_TIMESTAMPに任せるため、アプリからは書き込まない
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public MarketIndex() {
    }

    // --- getters & setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public BigDecimal getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(BigDecimal currentValue) {
        this.currentValue = currentValue;
    }

    public BigDecimal getChangeValue() {
        return changeValue;
    }

    public void setChangeValue(BigDecimal changeValue) {
        this.changeValue = changeValue;
    }

    public BigDecimal getChangePercent() {
        return changePercent;
    }

    public void setChangePercent(BigDecimal changePercent) {
        this.changePercent = changePercent;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public String getMarketType() {
      return marketType;
    }
    
    public void setMarketType(String marketType) {
        this.marketType = marketType;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}