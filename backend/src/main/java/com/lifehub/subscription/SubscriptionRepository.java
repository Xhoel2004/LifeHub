package com.lifehub.subscription;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByUserIdOrderByNextDueDateAsc(Long userId);

    /**
     * Scopes the lookup to the owning user in the query itself, so a subscription belonging
     * to another user comes back empty (-> 404) rather than requiring a separate
     * ownership check after the fact. This is the ownership guard for get/update/delete/actions.
     */
    Optional<Subscription> findByIdAndUserId(Long id, Long userId);
}
