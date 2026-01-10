package com.mmlimiteds.mithranmillets.service;

import com.mmlimiteds.mithranmillets.config.TokenUtil;
import com.mmlimiteds.mithranmillets.dto.UserProfileDTO;
import com.mmlimiteds.mithranmillets.entity.User;
import com.mmlimiteds.mithranmillets.repository.UserRepository;
import com.mmlimiteds.mithranmillets.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * TC-AUTH Test Suite - Service Layer Tests
 * Tests business logic correctness as specified in TEST_CASES.md
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private EmailService emailService;

    private AuthServiceImpl authService;
    private BCryptPasswordEncoder passwordEncoder;
    private User testUser;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthServiceImpl(
                userRepository,
                jwtUtil,
                modelMapper,
                passwordEncoder,
                emailService
        );

        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("Test@1234");
        testUser.setFullName("Test User");
        testUser.setPhone("1234567890");
        testUser.setRole("USER");
    }

//    @Test
//    @DisplayName("TC-AUTH-009: JWT Token Validation")
//    void testJWTTokenValidation() {
//        // Setup
//        String token = "jwt-token-123";
//        String username = "testuser";
//        String role = "USER";
//
//        when(jwtUtil.generateToken(username, role)).thenReturn(token);
//        when(jwtUtil.validateToken(token)).thenReturn(true);
//        when(jwtUtil.getUsernameFromToken(token)).thenReturn(username);
//        when(jwtUtil.getRoleFromToken(token)).thenReturn(role);
//
//        // Execute
//        String generatedToken = jwtUtil.generateToken(username, role);
//
//        // Verify
//        assertNotNull(generatedToken);
//        assertEquals(token, generatedToken);
//        assertTrue(jwtUtil.validateToken(token));
//        assertEquals(username, jwtUtil.getUsernameFromToken(token));
//        assertEquals(role, jwtUtil.getRoleFromToken(token));
//    }

    @Test
    @DisplayName("TC-AUTH-010: Password Hashing")
    void testPasswordHashing() {
        // Setup
        String plainPassword = "Test@1234";
        testUser.setPassword(plainPassword);
        
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            // Verify password is hashed (not plain text)
            assertNotEquals(plainPassword, savedUser.getPassword());
            assertTrue(passwordEncoder.matches(plainPassword, savedUser.getPassword()));
            // Verify hash format (BCrypt starts with $2a$, $2b$, or $2y$)
            assertTrue(savedUser.getPassword().startsWith("$2"));
            return savedUser;
        });

        // Execute
        ResponseEntity<?> response = authService.signup(testUser);

        // Verify
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("TC-AUTH: Signup - Duplicate Username")
    void testSignup_DuplicateUsername() {
        // Setup
        when(userRepository.findByUsername(testUser.getUsername()))
                .thenReturn(Optional.of(testUser));

        // Execute
        ResponseEntity<?> response = authService.signup(testUser);

        // Verify
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("TC-AUTH: Login - Invalid Password")
    void testLogin_InvalidPassword() {
        // Setup
        String hashedPassword = passwordEncoder.encode("Test@1234");
        testUser.setPassword(hashedPassword);

        Map<String, String> creds = new HashMap<>();
        creds.put("username", "testuser");
        creds.put("password", "WrongPassword");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Execute
        ResponseEntity<?> response = authService.login(creds);

        // Verify
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(jwtUtil, never()).generateToken(anyString(), anyString());
    }

    @Test
    @DisplayName("TC-AUTH: Login - Valid Credentials")
    void testLogin_ValidCredentials() {
        // Setup
        String hashedPassword = passwordEncoder.encode("Test@1234");
        testUser.setPassword(hashedPassword);

        Map<String, String> creds = new HashMap<>();
        creds.put("username", "testuser");
        creds.put("password", "Test@1234");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateToken("testuser", "USER")).thenReturn("jwt-token-123");

        // Execute
        ResponseEntity<?> response = authService.login(creds);

        // Verify
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(jwtUtil).generateToken("testuser", "USER");
    }

    @Test
    @DisplayName("TC-AUTH: Login - Non-existent User")
    void testLogin_NonExistentUser() {
        // Setup
        Map<String, String> creds = new HashMap<>();
        creds.put("username", "nonexistent");
        creds.put("password", "Test@1234");

        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Execute & Verify
        assertThrows(RuntimeException.class, () -> authService.login(creds));
        verify(jwtUtil, never()).generateToken(anyString(), anyString());
    }

    @Test
    @DisplayName("TC-AUTH: Admin Creation")
    void testCreateAdmin() {
        // Setup
        User newAdmin = new User();
        newAdmin.setUsername("newadmin");
        newAdmin.setEmail("admin@example.com");
        newAdmin.setPassword("Admin@1234");
        newAdmin.setFullName("New Admin");
        newAdmin.setRole("ADMIN");

        when(userRepository.findByUsername("newadmin")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(newAdmin);

        // Execute
        ResponseEntity<?> response = authService.createAdmin(newAdmin);

        // Verify
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("TC-AUTH: Get Profile")
    void testGetProfile() {
        // Setup
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        UserProfileDTO profileDTO = new UserProfileDTO();
        profileDTO.setUsername("testuser");
        profileDTO.setEmail("test@example.com");
        profileDTO.setFullName("Test User");

        when(modelMapper.map(testUser, UserProfileDTO.class)).thenReturn(profileDTO);

        // Execute
        ResponseEntity<UserProfileDTO> response = authService.getProfile(authentication);

        // Verify
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("testuser", response.getBody().getUsername());
    }

    @Test
    @DisplayName("TC-AUTH: Find By Username")
    void testFindByUsername() {
        // Setup
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Execute
        User found = authService.findByUsername("testuser");

        // Verify
        assertNotNull(found);
        assertEquals("testuser", found.getUsername());
    }

    @Test
    @DisplayName("TC-AUTH: Find By Username - Not Found")
    void testFindByUsername_NotFound() {
        // Setup
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Execute
        User found = authService.findByUsername("nonexistent");

        // Verify
        assertNull(found);
    }
}
