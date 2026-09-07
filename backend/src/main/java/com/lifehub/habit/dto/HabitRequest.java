package com.lifehub.habit.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HabitRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @Size(max = 200, message = "Description must be at most 200 characters")
        String description,

        @NotNull(message = "Weekly target is required")
        @Min(value = 1, message = "Weekly target must be at least 1")
        @Max(value = 7, message = "Weekly target must be at most 7")
        Integer weeklyTarget
) {
}
