package com.lifehub.subscription;

import com.lifehub.common.exception.ResourceNotFoundException;
import com.lifehub.subscription.dto.SubscriptionRequest;
import com.lifehub.subscription.dto.SubscriptionResponse;
import com.lifehub.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> listSubscriptions(User currentUser) {
        return subscriptionRepository.findByUserIdOrderByNextDueDateAsc(currentUser.getId()).stream()
                .map(SubscriptionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscription(User currentUser, Long id) {
        return SubscriptionMapper.toResponse(findOwnedSubscription(currentUser, id));
    }

    @Transactional
    public SubscriptionResponse createSubscription(User currentUser, SubscriptionRequest request) {
        Subscription subscription = new Subscription(
                currentUser,
                request.name(),
                request.category(),
                request.amount(),
                request.currency().toUpperCase(),
                request.billingCycle(),
                request.nextDueDate(),
                request.paymentMethod(),
                request.notes()
        );
        subscription = subscriptionRepository.save(subscription);
        return SubscriptionMapper.toResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse updateSubscription(User currentUser, Long id, SubscriptionRequest request) {
        Subscription subscription = findOwnedSubscription(currentUser, id);

        subscription.setName(request.name());
        subscription.setCategory(request.category());
        subscription.setAmount(request.amount());
        subscription.setCurrency(request.currency().toUpperCase());
        subscription.setBillingCycle(request.billingCycle());
        subscription.setNextDueDate(request.nextDueDate());
        subscription.setPaymentMethod(request.paymentMethod());
        subscription.setNotes(request.notes());

        return SubscriptionMapper.toResponse(subscription);
    }

    @Transactional
    public void deleteSubscription(User currentUser, Long id) {
        Subscription subscription = findOwnedSubscription(currentUser, id);
        subscriptionRepository.delete(subscription);
    }

    @Transactional
    public SubscriptionResponse pauseSubscription(User currentUser, Long id) {
        Subscription subscription = findOwnedSubscription(currentUser, id);
        subscription.setStatus(SubscriptionStatus.PAUSED);
        return SubscriptionMapper.toResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse resumeSubscription(User currentUser, Long id) {
        Subscription subscription = findOwnedSubscription(currentUser, id);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        return SubscriptionMapper.toResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse cancelSubscription(User currentUser, Long id) {
        Subscription subscription = findOwnedSubscription(currentUser, id);
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        return SubscriptionMapper.toResponse(subscription);
    }

    private Subscription findOwnedSubscription(User currentUser, Long id) {
        return subscriptionRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found: " + id));
    }
}
