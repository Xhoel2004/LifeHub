package com.lifehub.budget.dto;

import java.math.BigDecimal;

public record MonthlyOverviewResponse(
        String yearMonth,
        BigDecimal totalIncome,
        BigDecimal totalExpense
) {
}
