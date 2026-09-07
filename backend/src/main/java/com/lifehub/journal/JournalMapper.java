package com.lifehub.journal;

import com.lifehub.journal.dto.JournalEntryResponse;

public final class JournalMapper {

    private JournalMapper() {
    }

    public static JournalEntryResponse toResponse(JournalEntry entry) {
        return new JournalEntryResponse(
                entry.getId(),
                entry.getTitle(),
                entry.getBody(),
                entry.getMood(),
                entry.getEntryDate(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
