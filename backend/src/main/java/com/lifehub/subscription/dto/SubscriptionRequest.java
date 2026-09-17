package com.lifehub.subscription.dto;

import com.lifehub.subscription.BillingCycle;
import com.lifehub.subscription.PaymentMethod;
import com.lifehub.subscription.SubscriptionCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @NotNull(message = "Category is required")
        SubscriptionCategory category,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 10, fraction = 2, message = "Amount must have at most 2 decimal places")
        BigDecimal amount,

        @NotBlank(message = "Currency is required")
        @Size(min = 3, max = 3, message = "Currency must be a 3-letter code")
        String currency,

        @NotNull(message = "Billing cycle is required")
        BillingCycle billingCycle,

        @NotNull(message = "Next due date is required")
        LocalDate nextDueDate,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod,

        @Size(max = 500, message = "Notes must be at most 500 characters")
        String notes
) {
}
