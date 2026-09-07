package com.lifehub.habit.dto;

import java.time.Instant;
import java.util.List;

public record HabitResponse(
        Long id,
        String name,
        String description,
        int weeklyTarget,
        boolean completedToday,
        int currentStreak,
        int doneThisWeek,
        List<Boolean> weekLog,
        Instant createdAt,
        Instant updatedAt
) {
}
