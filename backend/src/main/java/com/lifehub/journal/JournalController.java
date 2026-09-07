package com.lifehub.journal;

import com.lifehub.journal.dto.JournalEntryRequest;
import com.lifehub.journal.dto.JournalEntryResponse;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/journal")
public class JournalController {

    private final JournalService journalService;

    public JournalController(JournalService journalService) {
        this.journalService = journalService;
    }

    @GetMapping
    public List<JournalEntryResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return journalService.listEntries(principal.getUser());
    }

    @GetMapping("/{id}")
    public JournalEntryResponse get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return journalService.getEntry(principal.getUser(), id);
    }

    @PostMapping
    public ResponseEntity<JournalEntryResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody JournalEntryRequest request
    ) {
        JournalEntryResponse response = journalService.createEntry(principal.getUser(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public JournalEntryResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody JournalEntryRequest request
    ) {
        return journalService.updateEntry(principal.getUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        journalService.deleteEntry(principal.getUser(), id);
        return ResponseEntity.noContent().build();
    }
}
