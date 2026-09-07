package com.lifehub.journal.dto;

import com.lifehub.journal.JournalMood;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record JournalEntryRequest(

        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must be at most 150 characters")
        String title,

        @NotBlank(message = "Body is required")
        String body,

        @NotNull(message = "Mood is required")
        JournalMood mood,

        @NotNull(message = "Entry date is required")
        LocalDate entryDate
) {
}
