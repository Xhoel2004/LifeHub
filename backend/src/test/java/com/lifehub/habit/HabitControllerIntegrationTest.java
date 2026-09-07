package com.lifehub.habit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifehub.habit.dto.HabitRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class HabitControllerIntegrationTest {

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

    private long createHabit(String token, String name) throws Exception {
        HabitRequest request = new HabitRequest(name, null);
        MvcResult result = mockMvc.perform(post("/api/habits")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void createHabitRequiresAuthentication() throws Exception {
        HabitRequest request = new HabitRequest("Meditate", null);

        mockMvc.perform(post("/api/habits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void fullCrudLifecycleForOwner() throws Exception {
        String token = registerAndGetToken("habitowner1@example.com");

        HabitRequest createReq = new HabitRequest("Read", "20 pages a day");

        MvcResult createResult = mockMvc.perform(post("/api/habits")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Read"))
                .andExpect(jsonPath("$.completedToday").value(false))
                .andExpect(jsonPath("$.currentStreak").value(0))
                .andReturn();

        long habitId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/habits/" + habitId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Read"));

        mockMvc.perform(get("/api/habits").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        HabitRequest updateReq = new HabitRequest("Read daily", "30 pages a day");

        mockMvc.perform(put("/api/habits/" + habitId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Read daily"));

        mockMvc.perform(delete("/api/habits/" + habitId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/habits/" + habitId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void loggingTodayMarksCompletedAndStartsStreak() throws Exception {
        String token = registerAndGetToken("habitowner2@example.com");
        long habitId = createHabit(token, "Exercise");
        String today = LocalDate.now().toString();

        mockMvc.perform(put("/api/habits/" + habitId + "/log/" + today)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedToday").value(true))
                .andExpect(jsonPath("$.currentStreak").value(1));

        // Idempotent: logging the same day again doesn't change the streak
        mockMvc.perform(put("/api/habits/" + habitId + "/log/" + today)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak").value(1));
    }

    @Test
    void streakCountsConsecutiveDaysAndBreaksOnGap() throws Exception {
        String token = registerAndGetToken("habitowner3@example.com");
        long habitId = createHabit(token, "Journal");
        LocalDate today = LocalDate.now();

        // Log today, yesterday, and the day before -> streak of 3
        for (int i = 0; i < 3; i++) {
            String date = today.minusDays(i).toString();
            mockMvc.perform(put("/api/habits/" + habitId + "/log/" + date)
                    .header("Authorization", "Bearer " + token));
        }

        mockMvc.perform(get("/api/habits/" + habitId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak").value(3));

        // A gap 5 days ago shouldn't extend the streak
        mockMvc.perform(put("/api/habits/" + habitId + "/log/" + today.minusDays(5))
                .header("Authorization", "Bearer " + token));

        mockMvc.perform(get("/api/habits/" + habitId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak").value(3));
    }

    @Test
    void unloggingRemovesCompletionAndBreaksStreak() throws Exception {
        String token = registerAndGetToken("habitowner4@example.com");
        long habitId = createHabit(token, "Stretch");
        String today = LocalDate.now().toString();

        mockMvc.perform(put("/api/habits/" + habitId + "/log/" + today)
                .header("Authorization", "Bearer " + token));

        mockMvc.perform(delete("/api/habits/" + habitId + "/log/" + today)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedToday").value(false))
                .andExpect(jsonPath("$.currentStreak").value(0));
    }

    @Test
    void cannotAccessAnotherUsersHabit() throws Exception {
        String ownerToken = registerAndGetToken("habitowner5@example.com");
        String otherToken = registerAndGetToken("habitother5@example.com");

        long habitId = createHabit(ownerToken, "Secret habit");

        mockMvc.perform(get("/api/habits/" + habitId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/habits/" + habitId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HabitRequest("Hacked", null))))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/habits/" + habitId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/habits/" + habitId + "/log/" + LocalDate.now())
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/habits").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createHabitValidatesBlankName() throws Exception {
        String token = registerAndGetToken("habitvalidation1@example.com");
        HabitRequest badReq = new HabitRequest("", null);

        mockMvc.perform(post("/api/habits")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }

    @Test
    void getNonexistentHabitReturns404() throws Exception {
        String token = registerAndGetToken("habitnotfound1@example.com");

        mockMvc.perform(get("/api/habits/999999").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
