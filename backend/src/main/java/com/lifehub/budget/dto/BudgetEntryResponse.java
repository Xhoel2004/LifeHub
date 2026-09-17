package com.lifehub.budget.dto;

import com.lifehub.budget.BudgetEntryType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record BudgetEntryResponse(
        Long id,
        BudgetEntryType type,
        BigDecimal amount,
        String category,
        String description,
        LocalDate entryDate,
        Instant createdAt,
        Instant updatedAt
) {
}
