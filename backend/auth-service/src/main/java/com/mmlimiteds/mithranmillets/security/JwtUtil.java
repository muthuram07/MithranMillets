package com.mmlimiteds.mithranmillets.security;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    // ✅ Secure key: must be at least 256 bits (32+ characters)
    private static final String SECRET = "MithranMilletsUltraSecureKey_1234567890_ABCDEF!";
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    // 🔐 Inject internal token with fallback default
    @Value("${internal.auth.token:DefaultInternalToken123}")
    private String internalAuthToken;

    // 🔐 Generate token with optional role claim
    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10 hours
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 🧑 Extract username from token
    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    // 🧑‍💼 Extract role from token
    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // ✅ Validate token against username and expiration
    public boolean isTokenValid(String token, String username) {
        try {
            return extractUsername(token).equals(username) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    // ⏳ Check if token is expired
    private boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    // 📦 Parse and return claims safely
    private Claims getClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Invalid JWT token: " + e.getMessage());
        }
    }

    // 🔒 Expose internal token for validation
    public String getInternalToken() {
        return internalAuthToken;
    }
}
