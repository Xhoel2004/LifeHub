package com.lifehub.journal;

import com.lifehub.common.exception.ResourceNotFoundException;
import com.lifehub.journal.dto.JournalEntryRequest;
import com.lifehub.journal.dto.JournalEntryResponse;
import com.lifehub.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;

    public JournalService(JournalEntryRepository journalEntryRepository) {
        this.journalEntryRepository = journalEntryRepository;
    }

    @Transactional(readOnly = true)
    public List<JournalEntryResponse> listEntries(User currentUser) {
        return journalEntryRepository.findByUserIdOrderByEntryDateDescCreatedAtDesc(currentUser.getId()).stream()
                .map(JournalMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public JournalEntryResponse getEntry(User currentUser, Long entryId) {
        return JournalMapper.toResponse(findOwnedEntry(currentUser, entryId));
    }

    @Transactional
    public JournalEntryResponse createEntry(User currentUser, JournalEntryRequest request) {
        JournalEntry entry = new JournalEntry(currentUser, request.title(), request.body(), request.mood(), request.entryDate());
        entry = journalEntryRepository.save(entry);
        return JournalMapper.toResponse(entry);
    }

    @Transactional
    public JournalEntryResponse updateEntry(User currentUser, Long entryId, JournalEntryRequest request) {
        JournalEntry entry = findOwnedEntry(currentUser, entryId);
        entry.setTitle(request.title());
        entry.setBody(request.body());
        entry.setMood(request.mood());
        entry.setEntryDate(request.entryDate());
        return JournalMapper.toResponse(entry);
    }

    @Transactional
    public void deleteEntry(User currentUser, Long entryId) {
        JournalEntry entry = findOwnedEntry(currentUser, entryId);
        journalEntryRepository.delete(entry);
    }

    private JournalEntry findOwnedEntry(User currentUser, Long entryId) {
        return journalEntryRepository.findByIdAndUserId(entryId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found: " + entryId));
    }
}
