package com.lifehub.budget.dto;

import java.math.BigDecimal;

public record BudgetSummaryResponse(
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal net
) {
}
