package com.lifehub.habit.dto;

import java.time.LocalDate;

public record HeatmapDayResponse(
        LocalDate date,
        int completed,
        int total
) {
}
