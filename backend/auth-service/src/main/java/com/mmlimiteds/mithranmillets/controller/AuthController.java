package com.mmlimiteds.mithranmillets.controller;

import com.mmlimiteds.mithranmillets.dto.UserDto;
import com.mmlimiteds.mithranmillets.dto.UserProfileDTO;
import com.mmlimiteds.mithranmillets.entity.User;
import com.mmlimiteds.mithranmillets.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5174")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody User user) {
        logger.debug("POST /auth/signup username='{}' email='{}'", user.getUsername(), user.getEmail());
        return authService.signup(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        String username = creds.get("username");
        String email = creds.get("email");
        logger.debug("POST /auth/login attempt username='{}' email='{}'", username, email);
        // do not log password
        return authService.login(creds);
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getProfile(Authentication authentication) {
        String principal = authentication != null ? authentication.getName() : "anonymous";
        logger.debug("GET /auth/profile principal='{}'", principal);
        return authService.getProfile(authentication);
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(Authentication authentication,
            @RequestBody Map<String, Object> updates) {
        String principal = authentication != null ? authentication.getName() : "anonymous";
        logger.debug("PATCH /auth/profile principal='{}' updates={}", principal, updates);
        return authService.updateProfile(authentication, updates);
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProfileDTO>> getAllUsersForAdmin() {
        logger.debug("GET /auth/admin/users (admin request)");
        List<UserProfileDTO> users = authService.getAllUsersForAdmin();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody User user) {
        logger.debug("POST /auth/admin/create username='{}' email='{}'", user.getUsername(), user.getEmail());
        return authService.createAdmin(user);
    }

    @GetMapping("/admin/check")
    public ResponseEntity<Map<String, Boolean>> checkAdminExists() {
        logger.debug("GET /auth/admin/check (checking if admin exists)");
        boolean exists = authService.hasAnyAdmin();
        return ResponseEntity.ok(Map.of("hasAdmin", exists));
    }

    @PostMapping("/admin/setup")
    public ResponseEntity<?> setupFirstAdmin(@Valid @RequestBody User user) {
        logger.debug("POST /auth/admin/setup username='{}' email='{}'", user.getUsername(), user.getEmail());
        return authService.createFirstAdmin(user);
    }

    // --- Forgot / Reset Password endpoints ---
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        logger.debug("POST /auth/forgot-password requested for email='{}'", email);
        // do not log token or any sensitive content
        return authService.forgotPassword(email);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        boolean hasToken = body.get("token") != null;
        String tokenPreview = hasToken ? "present" : "missing";
        logger.debug("POST /auth/reset-password token={}, passwordLength={}",
                tokenPreview,
                body.get("password") == null ? 0 : body.get("password").length());
        // Do NOT log actual token or password
        String token = body.get("token");
        String password = body.get("password");
        return authService.resetPassword(token, password);
    }
    
    @GetMapping("/internal/user/{username}")
    public ResponseEntity<UserDto> getUserByUsernameInternal(@PathVariable String username) {
        try {
            // AuthService should return entity User or Optional<User>
            User user = authService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            UserDto dto = new UserDto();
            dto.setUsername(user.getUsername());
            dto.setEmail(user.getEmail());
            dto.setFullName(user.getFullName());
            dto.setRole(user.getRole());
            return ResponseEntity.ok(dto);
        } catch (Exception ex) {
            // Log and return a controlled error
            logger.error("Internal user lookup failed for {}: {}", username, ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
}
