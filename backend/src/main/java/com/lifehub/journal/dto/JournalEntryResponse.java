package com.lifehub.journal.dto;

import com.lifehub.journal.JournalMood;

import java.time.Instant;
import java.time.LocalDate;

public record JournalEntryResponse(
        Long id,
        String title,
        String body,
        JournalMood mood,
        LocalDate entryDate,
        Instant createdAt,
        Instant updatedAt
) {
}
