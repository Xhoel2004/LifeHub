package com.lifehub.budget;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifehub.budget.dto.BudgetEntryRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs against the real (Dockerized) dev MySQL, same as TaskControllerIntegrationTest.
 * @Transactional wraps each test in a rollback-only transaction.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BudgetControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String registerAndGetToken(String email) throws Exception {
        Map<String, String> request = Map.of(
                "email", email,
                "password", "supersecret123",
                "displayName", "Test User"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("token").asText();
    }

    @Test
    void createEntryRequiresAuthentication() throws Exception {
        BudgetEntryRequest request = new BudgetEntryRequest(
                BudgetEntryType.EXPENSE, new BigDecimal("12.50"), "Food", null, LocalDate.of(2026, 9, 3));

        mockMvc.perform(post("/api/budget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void fullCrudLifecycleForOwner() throws Exception {
        String token = registerAndGetToken("budgetowner1@example.com");

        BudgetEntryRequest createReq = new BudgetEntryRequest(
                BudgetEntryType.EXPENSE, new BigDecimal("45.99"), "Groceries", "Weekly shop", LocalDate.of(2026, 9, 3));

        MvcResult createResult = mockMvc.perform(post("/api/budget")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("Groceries"))
                .andExpect(jsonPath("$.type").value("EXPENSE"))
                .andExpect(jsonPath("$.amount").value(45.99))
                .andReturn();

        long entryId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/budget/" + entryId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("Groceries"));

        mockMvc.perform(get("/api/budget").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/api/budget").param("month", "2026-09").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/api/budget").param("month", "2026-10").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        BudgetEntryRequest updateReq = new BudgetEntryRequest(
                BudgetEntryType.INCOME, new BigDecimal("100.00"), "Refund", null, LocalDate.of(2026, 9, 4));

        mockMvc.perform(put("/api/budget/" + entryId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("INCOME"))
                .andExpect(jsonPath("$.category").value("Refund"));

        mockMvc.perform(delete("/api/budget/" + entryId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/budget/" + entryId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void summaryComputesTotalsForMonth() throws Exception {
        String token = registerAndGetToken("budgetowner2@example.com");

        mockMvc.perform(post("/api/budget")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new BudgetEntryRequest(
                        BudgetEntryType.INCOME, new BigDecimal("2000.00"), "Salary", null, LocalDate.of(2026, 9, 1)))));

        mockMvc.perform(post("/api/budget")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new BudgetEntryRequest(
                        BudgetEntryType.EXPENSE, new BigDecimal("300.00"), "Rent", null, LocalDate.of(2026, 9, 2)))));

        mockMvc.perform(post("/api/budget")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new BudgetEntryRequest(
                        BudgetEntryType.EXPENSE, new BigDecimal("1000.00"), "Rent", null, LocalDate.of(2026, 8, 15)))));

        mockMvc.perform(get("/api/budget/summary").param("month", "2026-09").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(2000.00))
                .andExpect(jsonPath("$.totalExpense").value(300.00))
                .andExpect(jsonPath("$.net").value(1700.00));
    }

    @Test
    void cannotAccessAnotherUsersEntry() throws Exception {
        String ownerToken = registerAndGetToken("budgetowner3@example.com");
        String otherToken = registerAndGetToken("budgetother3@example.com");

        BudgetEntryRequest createReq = new BudgetEntryRequest(
                BudgetEntryType.EXPENSE, new BigDecimal("20.00"), "Secret", null, LocalDate.of(2026, 9, 3));

        MvcResult createResult = mockMvc.perform(post("/api/budget")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long entryId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/budget/" + entryId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/budget/" + entryId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/budget/" + entryId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/budget").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createEntryValidatesNonPositiveAmount() throws Exception {
        String token = registerAndGetToken("budgetvalidation1@example.com");
        BudgetEntryRequest badReq = new BudgetEntryRequest(
                BudgetEntryType.EXPENSE, new BigDecimal("0.00"), "Food", null, LocalDate.of(2026, 9, 3));

        mockMvc.perform(post("/api/budget")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.amount").exists());
    }

    @Test
    void getNonexistentEntryReturns404() throws Exception {
        String token = registerAndGetToken("budgetnotfound1@example.com");

        mockMvc.perform(get("/api/budget/999999").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
