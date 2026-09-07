package com.lifehub.habit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HabitRepository extends JpaRepository<Habit, Long> {

    List<Habit> findByUserIdOrderByCreatedAtAsc(Long userId);

    /**
     * Scopes the lookup to the owning user in the query itself, so a habit belonging
     * to another user comes back empty (-> 404) rather than requiring a separate
     * ownership check after the fact. This is the ownership guard for get/update/delete/log.
     */
    Optional<Habit> findByIdAndUserId(Long id, Long userId);
}
