package com.lifehub.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserId(Long userId);

    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);

    /**
     * Scopes the lookup to the owning user in the query itself, so a task belonging
     * to another user comes back empty (-> 404) rather than requiring a separate
     * ownership check after the fact. This is the ownership guard for get/update/delete.
     */
    Optional<Task> findByIdAndUserId(Long id, Long userId);
}
