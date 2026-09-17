package com.lifehub.budget;

import com.lifehub.budget.dto.BudgetEntryRequest;
import com.lifehub.budget.dto.BudgetEntryResponse;
import com.lifehub.budget.dto.BudgetSummaryResponse;
import com.lifehub.budget.dto.MonthlyOverviewResponse;
import com.lifehub.user.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/budget")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public List<BudgetEntryResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month
    ) {
        return budgetService.listEntries(principal.getUser(), month);
    }

    @GetMapping("/summary")
    public BudgetSummaryResponse summary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month
    ) {
        return budgetService.getSummary(principal.getUser(), month);
    }

    @GetMapping("/{id}")
    public BudgetEntryResponse get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return budgetService.getEntry(principal.getUser(), id);
    }

    @GetMapping("/overview")
    public List<MonthlyOverviewResponse> overview(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "6") int months
    ) {
        return budgetService.getMonthlyOverview(principal.getUser(), months);
    }

    @PostMapping
    public ResponseEntity<BudgetEntryResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BudgetEntryRequest request
    ) {
        BudgetEntryResponse response = budgetService.createEntry(principal.getUser(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public BudgetEntryResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody BudgetEntryRequest request
    ) {
        return budgetService.updateEntry(principal.getUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        budgetService.deleteEntry(principal.getUser(), id);
        return ResponseEntity.noContent().build();
    }
}
