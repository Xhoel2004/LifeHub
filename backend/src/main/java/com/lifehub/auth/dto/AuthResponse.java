package com.lifehub.auth.dto;

import java.time.Instant;

public record AuthResponse(String token, Instant expiresAt) {
}
