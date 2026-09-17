package com.lifehub.subscription;

import com.lifehub.subscription.dto.SubscriptionResponse;

public final class SubscriptionMapper {

    private SubscriptionMapper() {
    }

    public static SubscriptionResponse toResponse(Subscription subscription) {
        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getName(),
                subscription.getCategory(),
                subscription.getAmount(),
                subscription.getCurrency(),
                subscription.getBillingCycle(),
                subscription.getNextDueDate(),
                subscription.getPaymentMethod(),
                subscription.getStatus(),
                subscription.getNotes(),
                subscription.getCreatedAt(),
                subscription.getUpdatedAt()
        );
    }
}
