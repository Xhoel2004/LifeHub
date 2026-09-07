package com.lifehub.journal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    List<JournalEntry> findByUserIdOrderByEntryDateDescCreatedAtDesc(Long userId);

    /**
     * Scopes the lookup to the owning user in the query itself, so an entry belonging
     * to another user comes back empty (-> 404) rather than requiring a separate
     * ownership check after the fact. This is the ownership guard for get/update/delete.
     */
    Optional<JournalEntry> findByIdAndUserId(Long id, Long userId);
}
