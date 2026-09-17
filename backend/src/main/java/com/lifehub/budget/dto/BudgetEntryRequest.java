package com.lifehub.budget.dto;

import com.lifehub.budget.BudgetEntryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetEntryRequest(

        @NotNull(message = "Type is required")
        BudgetEntryType type,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 10, fraction = 2, message = "Amount must have at most 2 decimal places")
        BigDecimal amount,

        @NotBlank(message = "Category is required")
        @Size(max = 50, message = "Category must be at most 50 characters")
        String category,

        @Size(max = 200, message = "Description must be at most 200 characters")
        String description,

        @NotNull(message = "Entry date is required")
        LocalDate entryDate
) {
}
