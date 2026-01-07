package com.mmlimiteds.mithranmillets.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.mmlimiteds.mithranmillets.config.TokenUtil;
import com.mmlimiteds.mithranmillets.dto.UserProfileDTO;
import com.mmlimiteds.mithranmillets.entity.User;
import com.mmlimiteds.mithranmillets.repository.UserRepository;
import com.mmlimiteds.mithranmillets.security.JwtUtil;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private final ModelMapper modelMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final long RESET_TOKEN_EXPIRE_MINUTES = 60; // 1 hour

    @Autowired
    public AuthServiceImpl(UserRepository userRepo,
                           JwtUtil jwtUtil,
                           ModelMapper modelMapper,
                           BCryptPasswordEncoder passwordEncoder,
                           EmailService emailService) {
        this.userRepo = userRepo;
        this.jwtUtil = jwtUtil;
        this.modelMapper = modelMapper;
        this.passwordEncoder = passwordEncoder != null ? passwordEncoder : new BCryptPasswordEncoder();
        this.emailService = emailService;
    }

    @Override
    public ResponseEntity<?> signup(User user) {
        logger.debug("Attempting signup for username '{}'", user.getUsername());
        Optional<User> existingUser = userRepo.findByUsername(user.getUsername());
        if (existingUser.isPresent()) {
            logger.info("Signup failed: username '{}' already exists", user.getUsername());
            return ResponseEntity.status(409).body(Map.of("message", "User already exists"));
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepo.save(user);
        logger.info("User '{}' registered successfully", user.getUsername());
        return ResponseEntity.status(201).body(Map.of("message", "User registered successfully"));
    }

    @Override
    public ResponseEntity<?> login(Map<String, String> creds) {
        String username = creds.get("username");
        String email = creds.get("email");
        String password = creds.get("password");

        logger.debug("Login attempt for username='{}' email='{}'", username, email);

        if ((username == null || username.isBlank()) && (email == null || email.isBlank())) {
            logger.warn("Login failed: missing username and email");
            return ResponseEntity.badRequest().body(Map.of("message", "Username or email is required"));
        }
        if (password == null || password.isBlank()) {
            logger.warn("Login failed: missing password for username='{}' email='{}'", username, email);
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        }

        Optional<User> userOpt;
        if (username != null && !username.isBlank()) {
            userOpt = userRepo.findByUsername(username);
        } else {
            userOpt = userRepo.findByEmail(email);
        }

        User user = userOpt.orElseThrow(() -> {
            logger.warn("Login failed: user not found for username='{}' email='{}'", username, email);
            return new RuntimeException("Invalid credentials");
        });

        if (!passwordEncoder.matches(password, user.getPassword())) {
            logger.warn("Login failed: invalid credentials for user '{}'", user.getUsername());
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        logger.info("User '{}' logged in successfully", user.getUsername());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @Override
    public ResponseEntity<UserProfileDTO> getProfile(Authentication authentication) {
        String username = authentication.getName();
        logger.debug("Fetching profile for '{}'", username);
        Optional<User> userOpt = userRepo.findByUsername(username);

        return userOpt.map(user -> {
            UserProfileDTO dto = toProfileDto(user);
            logger.debug("Profile found for '{}'", username);
            return ResponseEntity.ok(dto);
        }).orElseThrow(() -> {
            logger.error("Profile not found for '{}'", username);
            return new UsernameNotFoundException("User not found");
        });
    }

    @Override
    public ResponseEntity<UserProfileDTO> updateProfile(Authentication authentication, Map<String, Object> updates) {
        String username = authentication.getName();
        logger.debug("Updating profile for '{}', updates={}", username, updates);
        Optional<User> userOpt = userRepo.findByUsername(username);

        if (userOpt.isEmpty()) {
            logger.error("Update failed: user '{}' not found", username);
            throw new UsernameNotFoundException("User not found");
        }

        User user = userOpt.get();

        if (updates.containsKey("email")) {
            user.setEmail((String) updates.get("email"));
        }
        if (updates.containsKey("fullName")) {
            user.setFullName((String) updates.get("fullName"));
        }
        if (updates.containsKey("phone")) {
            user.setPhone((String) updates.get("phone"));
        }

        User updatedUser = userRepo.save(user);
        logger.info("Profile updated for '{}'", username);
        UserProfileDTO dto = toProfileDto(updatedUser);
        return ResponseEntity.ok(dto);
    }

    @Override
    public List<UserProfileDTO> getAllUsersForAdmin() {
        logger.debug("Fetching all users for admin");
        return userRepo.findAll()
                .stream()
                .map(this::toProfileDto)
                .collect(Collectors.toList());
    }

    private UserProfileDTO toProfileDto(User user) {
        return modelMapper.map(user, UserProfileDTO.class);
    }

    // --- Forgot password: generate token, store hashed token + expiry, send email ---
    @Override
    public ResponseEntity<?> forgotPassword(String email) {
        logger.debug("Forgot password requested for email='{}'", email);

        // Always return OK to avoid account enumeration
        if (email == null || email.isBlank()) {
            logger.warn("Forgot password called with empty email");
            return ResponseEntity.ok(Map.of("message", "If an account exists a reset link will be sent"));
        }

        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            logger.info("Forgot password: no user found for email='{}' (returning generic response)", email);
            return ResponseEntity.ok(Map.of("message", "If an account exists a reset link will be sent"));
        }

        User user = userOpt.get();

        // generate token and hash it
        String rawToken = TokenUtil.generateRawToken();
        String hashed = TokenUtil.sha256Hex(rawToken);
        Instant expiresAt = Instant.now().plus(RESET_TOKEN_EXPIRE_MINUTES, ChronoUnit.MINUTES);

        user.setResetPasswordToken(hashed);
        user.setResetPasswordExpires(expiresAt);
        userRepo.save(user);
        logger.info("Reset token stored for user='{}', expiresAt={}", user.getUsername(), expiresAt);

        // build reset URL (ensure FRONTEND_BASE_URL in environment or properties)
        String frontendBase = System.getenv().getOrDefault("FRONTEND_BASE_URL", "http://localhost:5174");
        String resetUrl = frontendBase + "/reset-password?token=" + rawToken;

        String subject = "Reset your password";
        String html = "<p>Hi " + (user.getFullName() != null ? user.getFullName() : user.getUsername()) + ",</p>"
                + "<p>Click the link below to reset your password. The link expires in 1 hour.</p>"
                + "<p><a href=\"" + resetUrl + "\">Reset password</a></p>";

        try {
            logger.debug("Sending reset email to '{}'", user.getEmail());
            emailService.sendSimpleMessage(user.getEmail(), subject, html);
            logger.info("Reset email sent to '{}'", user.getEmail());
        } catch (Exception e) {
            logger.error("Error sending reset email to '{}': {}", user.getEmail(), e.getMessage(), e);
            // do not propagate email failure to the client
        }

        return ResponseEntity.ok(Map.of("message", "If an account exists a reset link will be sent"));
    }

    // --- Reset password: verify token and expiry, update password, clear token fields ---
    @Override
    public ResponseEntity<?> resetPassword(String token, String newPassword) {
        logger.debug("Reset password attempt with token present: {}", token != null);
        if (token == null || token.isBlank() || newPassword == null || newPassword.length() < 8) {
            logger.warn("Reset password failed: invalid request (token present: {}, password length: {})",
                    token != null, newPassword == null ? 0 : newPassword.length());
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid request"));
        }

        String hashed = TokenUtil.sha256Hex(token);
        Optional<User> userOpt = userRepo.findByResetPasswordToken(hashed);

        if (userOpt.isEmpty()) {
            logger.warn("Reset password failed: token not found or invalid");
            return ResponseEntity.badRequest().body(Map.of("message", "Token invalid or expired"));
        }

        User user = userOpt.get();
        if (user.getResetPasswordExpires() == null || Instant.now().isAfter(user.getResetPasswordExpires())) {
            logger.warn("Reset password failed: token expired for user='{}'", user.getUsername());
            return ResponseEntity.badRequest().body(Map.of("message", "Token invalid or expired"));
        }

        // update stored password
        user.setPassword(passwordEncoder.encode(newPassword));
        // clear reset fields
        user.setResetPasswordToken(null);
        user.setResetPasswordExpires(null);
        userRepo.save(user);
        logger.info("Password updated for user='{}'", user.getUsername());

        // optionally send confirmation email
        try {
            String subject = "Your password was changed";
            String html = "<p>Your password was successfully changed.</p>";
            logger.debug("Sending password-changed confirmation to '{}'", user.getEmail());
            emailService.sendSimpleMessage(user.getEmail(), subject, html);
            logger.info("Password-changed confirmation sent to '{}'", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send password change confirmation to '{}': {}", user.getEmail(), e.getMessage(), e);
        }

        return ResponseEntity.ok(Map.of("message", "Password updated"));
    }
    
    @Override
    public User findByUsername(String username) {
        if (username == null || username.isBlank()) return null;
        Optional<User> u = userRepo.findById(username);
        return u.orElse(null);
    }
    
    @Override
    public ResponseEntity<?> createAdmin(User user) {
        logger.debug("Admin creation attempt for username '{}'", user.getUsername());
        
        // Ensure role is set to ADMIN
        if (user.getRole() == null || !user.getRole().equals("ADMIN")) {
            user.setRole("ADMIN");
        }
        
        // Check if user already exists
        Optional<User> existingUser = userRepo.findByUsername(user.getUsername());
        if (existingUser.isPresent()) {
            logger.info("Admin creation failed: username '{}' already exists", user.getUsername());
            return ResponseEntity.status(409).body(Map.of("message", "User already exists"));
        }
        
        // Check if email already exists
        Optional<User> existingEmail = userRepo.findByEmail(user.getEmail());
        if (existingEmail.isPresent()) {
            logger.info("Admin creation failed: email '{}' already exists", user.getEmail());
            return ResponseEntity.status(409).body(Map.of("message", "Email already exists"));
        }
        
        // Encode password and save
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepo.save(user);
        logger.info("Admin '{}' created successfully", user.getUsername());
        return ResponseEntity.status(201).body(Map.of("message", "Admin created successfully"));
    }
    
    @Override
    public boolean hasAnyAdmin() {
        logger.debug("Checking if any admin exists");
        return userRepo.findAll()
                .stream()
                .anyMatch(u -> "ADMIN".equals(u.getRole()));
    }
    
    @Override
    public ResponseEntity<?> createFirstAdmin(User user) {
        logger.debug("First admin creation attempt for username '{}'", user.getUsername());
        
        // Check if any admin already exists
        if (hasAnyAdmin()) {
            logger.warn("First admin creation failed: admin already exists");
            return ResponseEntity.status(403).body(Map.of("message", "Admin already exists. Use the protected endpoint to create additional admins."));
        }
        
        // Ensure role is set to ADMIN
        user.setRole("ADMIN");
        
        // Check if user already exists
        Optional<User> existingUser = userRepo.findByUsername(user.getUsername());
        if (existingUser.isPresent()) {
            logger.info("First admin creation failed: username '{}' already exists", user.getUsername());
            return ResponseEntity.status(409).body(Map.of("message", "User already exists"));
        }
        
        // Check if email already exists
        Optional<User> existingEmail = userRepo.findByEmail(user.getEmail());
        if (existingEmail.isPresent()) {
            logger.info("First admin creation failed: email '{}' already exists", user.getEmail());
            return ResponseEntity.status(409).body(Map.of("message", "Email already exists"));
        }
        
        // Encode password and save
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepo.save(user);
        logger.info("First admin '{}' created successfully", user.getUsername());
        return ResponseEntity.status(201).body(Map.of("message", "First admin created successfully"));
    }
}
