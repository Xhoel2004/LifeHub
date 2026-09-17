package com.lifehub.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifehub.subscription.dto.SubscriptionRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs against the real (Dockerized) dev MySQL, same as BudgetControllerIntegrationTest.
 * @Transactional wraps each test in a rollback-only transaction.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SubscriptionControllerIntegrationTest {

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

    private SubscriptionRequest sampleRequest() {
        return new SubscriptionRequest(
                "Netflix", SubscriptionCategory.STREAMING, new BigDecimal("15.99"), "eur",
                BillingCycle.MONTHLY, LocalDate.of(2026, 9, 20), PaymentMethod.CREDIT_CARD, "Family plan");
    }

    @Test
    void createSubscriptionRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void fullCrudLifecycleForOwner() throws Exception {
        String token = registerAndGetToken("subowner1@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/subscriptions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Netflix"))
                .andExpect(jsonPath("$.category").value("STREAMING"))
                .andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();

        long id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/subscriptions/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Netflix"));

        mockMvc.perform(get("/api/subscriptions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        SubscriptionRequest updateReq = new SubscriptionRequest(
                "Netflix Premium", SubscriptionCategory.STREAMING, new BigDecimal("19.99"), "usd",
                BillingCycle.MONTHLY, LocalDate.of(2026, 10, 1), PaymentMethod.PAYPAL, null);

        mockMvc.perform(put("/api/subscriptions/" + id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Netflix Premium"))
                .andExpect(jsonPath("$.currency").value("USD"));

        mockMvc.perform(delete("/api/subscriptions/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/subscriptions/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void pauseResumeAndCancelTransitionStatus() throws Exception {
        String token = registerAndGetToken("subowner2@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/subscriptions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andReturn();

        long id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(patch("/api/subscriptions/" + id + "/pause").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAUSED"));

        mockMvc.perform(patch("/api/subscriptions/" + id + "/resume").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(patch("/api/subscriptions/" + id + "/cancel").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void cannotAccessAnotherUsersSubscription() throws Exception {
        String ownerToken = registerAndGetToken("subowner3@example.com");
        String otherToken = registerAndGetToken("subother3@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/subscriptions")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andReturn();

        long id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/subscriptions/" + id).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/subscriptions/" + id)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/subscriptions/" + id + "/pause").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/subscriptions/" + id).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/subscriptions").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createSubscriptionValidatesNonPositiveAmount() throws Exception {
        String token = registerAndGetToken("subvalidation1@example.com");
        SubscriptionRequest badReq = new SubscriptionRequest(
                "Netflix", SubscriptionCategory.STREAMING, new BigDecimal("0.00"), "eur",
                BillingCycle.MONTHLY, LocalDate.of(2026, 9, 20), PaymentMethod.CREDIT_CARD, null);

        mockMvc.perform(post("/api/subscriptions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.amount").exists());
    }

    @Test
    void createSubscriptionValidatesRequiredFields() throws Exception {
        String token = registerAndGetToken("subvalidation2@example.com");

        mockMvc.perform(post("/api/subscriptions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.category").exists())
                .andExpect(jsonPath("$.fieldErrors.amount").exists())
                .andExpect(jsonPath("$.fieldErrors.currency").exists())
                .andExpect(jsonPath("$.fieldErrors.billingCycle").exists())
                .andExpect(jsonPath("$.fieldErrors.nextDueDate").exists())
                .andExpect(jsonPath("$.fieldErrors.paymentMethod").exists());
    }

    @Test
    void getNonexistentSubscriptionReturns404() throws Exception {
        String token = registerAndGetToken("subnotfound1@example.com");

        mockMvc.perform(get("/api/subscriptions/999999").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
