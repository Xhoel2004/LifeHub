package com.lifehub.budget;

import com.lifehub.budget.dto.BudgetEntryResponse;

public final class BudgetMapper {

    private BudgetMapper() {
    }

    public static BudgetEntryResponse toResponse(BudgetEntry entry) {
        return new BudgetEntryResponse(
                entry.getId(),
                entry.getType(),
                entry.getAmount(),
                entry.getCategory(),
                entry.getDescription(),
                entry.getEntryDate(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
