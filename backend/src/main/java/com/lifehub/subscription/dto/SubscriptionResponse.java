package com.lifehub.subscription.dto;

import com.lifehub.subscription.BillingCycle;
import com.lifehub.subscription.PaymentMethod;
import com.lifehub.subscription.SubscriptionCategory;
import com.lifehub.subscription.SubscriptionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SubscriptionResponse(
        Long id,
        String name,
        SubscriptionCategory category,
        BigDecimal amount,
        String currency,
        BillingCycle billingCycle,
        LocalDate nextDueDate,
        PaymentMethod paymentMethod,
        SubscriptionStatus status,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}
