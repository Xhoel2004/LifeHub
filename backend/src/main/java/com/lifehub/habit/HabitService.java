package com.lifehub.habit;

import com.lifehub.common.exception.ResourceNotFoundException;
import com.lifehub.habit.dto.HabitRequest;
import com.lifehub.habit.dto.HabitResponse;
import com.lifehub.habit.dto.HeatmapDayResponse;
import com.lifehub.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    public HabitService(HabitRepository habitRepository, HabitLogRepository habitLogRepository) {
        this.habitRepository = habitRepository;
        this.habitLogRepository = habitLogRepository;
    }

    @Transactional(readOnly = true)
    public List<HabitResponse> listHabits(User currentUser) {
        return habitRepository.findByUserIdOrderByCreatedAtAsc(currentUser.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HabitResponse getHabit(User currentUser, Long habitId) {
        return toResponse(findOwnedHabit(currentUser, habitId));
    }

    @Transactional
    public HabitResponse createHabit(User currentUser, HabitRequest request) {
        Habit habit = new Habit(currentUser, request.name(), request.description(), request.weeklyTarget());
        habit = habitRepository.save(habit);
        return toResponse(habit);
    }

    @Transactional
    public HabitResponse updateHabit(User currentUser, Long habitId, HabitRequest request) {
        Habit habit = findOwnedHabit(currentUser, habitId);
        habit.setName(request.name());
        habit.setDescription(request.description());
        habit.setWeeklyTarget(request.weeklyTarget());
        return toResponse(habit);
    }

    @Transactional
    public void deleteHabit(User currentUser, Long habitId) {
        Habit habit = findOwnedHabit(currentUser, habitId);
        habitRepository.delete(habit);
    }

    @Transactional
    public HabitResponse logCompletion(User currentUser, Long habitId, LocalDate date) {
        Habit habit = findOwnedHabit(currentUser, habitId);
        if (habitLogRepository.findByHabitIdAndLogDate(habitId, date).isEmpty()) {
            habitLogRepository.save(new HabitLog(habit, date));
        }
        return toResponse(habit);
    }

    @Transactional
    public HabitResponse unlogCompletion(User currentUser, Long habitId, LocalDate date) {
        Habit habit = findOwnedHabit(currentUser, habitId);
        habitLogRepository.deleteByHabitIdAndLogDate(habitId, date);
        return toResponse(habit);
    }

    @Transactional(readOnly = true)
    public List<HeatmapDayResponse> getHeatmap(User currentUser, int weeks) {
        List<Habit> habits = habitRepository.findByUserIdOrderByCreatedAtAsc(currentUser.getId());
        int totalHabits = habits.size();
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays((long) weeks * 7 - 1);

        Map<LocalDate, Set<Long>> habitsCompletedByDate = new HashMap<>();
        if (totalHabits > 0) {
            List<Long> habitIds = habits.stream().map(Habit::getId).toList();
            for (HabitLog log : habitLogRepository.findByHabitIdInAndLogDateGreaterThanEqual(habitIds, startDate)) {
                habitsCompletedByDate
                        .computeIfAbsent(log.getLogDate(), d -> new HashSet<>())
                        .add(log.getHabit().getId());
            }
        }

        List<HeatmapDayResponse> days = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(today); date = date.plusDays(1)) {
            int completed = habitsCompletedByDate.getOrDefault(date, Set.of()).size();
            days.add(new HeatmapDayResponse(date, completed, totalHabits));
        }
        return days;
    }

    private Habit findOwnedHabit(User currentUser, Long habitId) {
        return habitRepository.findByIdAndUserId(habitId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Habit not found: " + habitId));
    }

    private HabitResponse toResponse(Habit habit) {
        Set<LocalDate> logDates = new HashSet<>();
        for (HabitLog log : habitLogRepository.findByHabitId(habit.getId())) {
            logDates.add(log.getLogDate());
        }

        LocalDate today = LocalDate.now();
        boolean completedToday = logDates.contains(today);
        int streak = calculateStreak(logDates, today);

        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<Boolean> weekLog = new ArrayList<>(7);
        int doneThisWeek = 0;
        for (int i = 0; i < 7; i++) {
            boolean done = logDates.contains(weekStart.plusDays(i));
            weekLog.add(done);
            if (done) {
                doneThisWeek++;
            }
        }

        return new HabitResponse(
                habit.getId(),
                habit.getName(),
                habit.getDescription(),
                habit.getWeeklyTarget(),
                completedToday,
                streak,
                doneThisWeek,
                weekLog,
                habit.getCreatedAt(),
                habit.getUpdatedAt()
        );
    }

    /**
     * Counts consecutive completed days ending today, or ending yesterday if today
     * isn't logged yet -- so the streak isn't lost just because the user hasn't
     * checked in yet today.
     */
    private static int calculateStreak(Set<LocalDate> logDates, LocalDate today) {
        LocalDate cursor = logDates.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (logDates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }
}
