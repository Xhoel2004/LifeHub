package com.lifehub.habit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {

    List<HabitLog> findByHabitId(Long habitId);

    Optional<HabitLog> findByHabitIdAndLogDate(Long habitId, LocalDate logDate);

    void deleteByHabitIdAndLogDate(Long habitId, LocalDate logDate);

    List<HabitLog> findByHabitIdInAndLogDateGreaterThanEqual(Collection<Long> habitIds, LocalDate since);
}
