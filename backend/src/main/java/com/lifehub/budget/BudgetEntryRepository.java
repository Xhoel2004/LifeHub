package com.lifehub.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetEntryRepository extends JpaRepository<BudgetEntry, Long> {

    List<BudgetEntry> findByUserIdOrderByEntryDateDesc(Long userId);

    List<BudgetEntry> findByUserIdAndEntryDateBetweenOrderByEntryDateDesc(Long userId, LocalDate start, LocalDate end);

    /**
     * Scopes the lookup to the owning user in the query itself, so an entry belonging
     * to another user comes back empty (-> 404) rather than requiring a separate
     * ownership check after the fact. This is the ownership guard for get/update/delete.
     */
    Optional<BudgetEntry> findByIdAndUserId(Long id, Long userId);
}
