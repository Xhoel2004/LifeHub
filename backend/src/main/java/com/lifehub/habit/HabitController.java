package com.lifehub.habit;

import com.lifehub.habit.dto.HabitRequest;
import com.lifehub.habit.dto.HabitResponse;
import com.lifehub.habit.dto.HeatmapDayResponse;
import com.lifehub.user.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/habits")
public class HabitController {

    private final HabitService habitService;

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    @GetMapping
    public List<HabitResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return habitService.listHabits(principal.getUser());
    }

    @GetMapping("/{id}")
    public HabitResponse get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return habitService.getHabit(principal.getUser(), id);
    }

    @GetMapping("/heatmap")
    public List<HeatmapDayResponse> heatmap(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "12") int weeks
    ) {
        return habitService.getHeatmap(principal.getUser(), weeks);
    }

    @PostMapping
    public ResponseEntity<HabitResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody HabitRequest request
    ) {
        HabitResponse response = habitService.createHabit(principal.getUser(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public HabitResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody HabitRequest request
    ) {
        return habitService.updateHabit(principal.getUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        habitService.deleteHabit(principal.getUser(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/log/{date}")
    public HabitResponse logCompletion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @PathVariable LocalDate date
    ) {
        return habitService.logCompletion(principal.getUser(), id, date);
    }

    @DeleteMapping("/{id}/log/{date}")
    public HabitResponse unlogCompletion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @PathVariable LocalDate date
    ) {
        return habitService.unlogCompletion(principal.getUser(), id, date);
    }
}
