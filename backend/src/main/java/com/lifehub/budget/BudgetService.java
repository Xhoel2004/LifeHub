package com.lifehub.budget;

import com.lifehub.budget.dto.BudgetEntryRequest;
import com.lifehub.budget.dto.BudgetEntryResponse;
import com.lifehub.budget.dto.BudgetSummaryResponse;
import com.lifehub.budget.dto.MonthlyOverviewResponse;
import com.lifehub.common.exception.ResourceNotFoundException;
import com.lifehub.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class BudgetService {

    private final BudgetEntryRepository budgetEntryRepository;

    public BudgetService(BudgetEntryRepository budgetEntryRepository) {
        this.budgetEntryRepository = budgetEntryRepository;
    }

    @Transactional(readOnly = true)
    public List<BudgetEntryResponse> listEntries(User currentUser, YearMonth month) {
        return findEntries(currentUser, month).stream().map(BudgetMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BudgetEntryResponse getEntry(User currentUser, Long entryId) {
        return BudgetMapper.toResponse(findOwnedEntry(currentUser, entryId));
    }

    @Transactional(readOnly = true)
    public BudgetSummaryResponse getSummary(User currentUser, YearMonth month) {
        List<BudgetEntry> entries = findEntries(currentUser, month);

        BigDecimal totalIncome = sumByType(entries, BudgetEntryType.INCOME);
        BigDecimal totalExpense = sumByType(entries, BudgetEntryType.EXPENSE);

        return new BudgetSummaryResponse(totalIncome, totalExpense, totalIncome.subtract(totalExpense));
    }

    @Transactional(readOnly = true)
    public List<MonthlyOverviewResponse> getMonthlyOverview(User currentUser, int months) {
        YearMonth currentMonth = YearMonth.now();
        YearMonth startMonth = currentMonth.minusMonths(months - 1L);

        List<BudgetEntry> entries = budgetEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateDesc(
                currentUser.getId(), startMonth.atDay(1), currentMonth.atEndOfMonth());

        List<MonthlyOverviewResponse> overview = new ArrayList<>();
        for (YearMonth ym = startMonth; !ym.isAfter(currentMonth); ym = ym.plusMonths(1)) {
            YearMonth month = ym;
            List<BudgetEntry> monthEntries = entries.stream()
                    .filter(e -> YearMonth.from(e.getEntryDate()).equals(month))
                    .toList();
            overview.add(new MonthlyOverviewResponse(
                    month.toString(),
                    sumByType(monthEntries, BudgetEntryType.INCOME),
                    sumByType(monthEntries, BudgetEntryType.EXPENSE)
            ));
        }
        return overview;
    }

    @Transactional
    public BudgetEntryResponse createEntry(User currentUser, BudgetEntryRequest request) {
        BudgetEntry entry = new BudgetEntry(
                currentUser,
                request.type(),
                request.amount(),
                request.category(),
                request.description(),
                request.entryDate()
        );
        entry = budgetEntryRepository.save(entry);
        return BudgetMapper.toResponse(entry);
    }

    @Transactional
    public BudgetEntryResponse updateEntry(User currentUser, Long entryId, BudgetEntryRequest request) {
        BudgetEntry entry = findOwnedEntry(currentUser, entryId);

        entry.setType(request.type());
        entry.setAmount(request.amount());
        entry.setCategory(request.category());
        entry.setDescription(request.description());
        entry.setEntryDate(request.entryDate());

        return BudgetMapper.toResponse(entry);
    }

    @Transactional
    public void deleteEntry(User currentUser, Long entryId) {
        BudgetEntry entry = findOwnedEntry(currentUser, entryId);
        budgetEntryRepository.delete(entry);
    }

    private List<BudgetEntry> findEntries(User currentUser, YearMonth month) {
        if (month == null) {
            return budgetEntryRepository.findByUserIdOrderByEntryDateDesc(currentUser.getId());
        }
        LocalDate start = month.atDay(1);
        LocalDate end = month.atEndOfMonth();
        return budgetEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateDesc(currentUser.getId(), start, end);
    }

    private static BigDecimal sumByType(List<BudgetEntry> entries, BudgetEntryType type) {
        return entries.stream()
                .filter(entry -> entry.getType() == type)
                .map(BudgetEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BudgetEntry findOwnedEntry(User currentUser, Long entryId) {
        return budgetEntryRepository.findByIdAndUserId(entryId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget entry not found: " + entryId));
    }
}
