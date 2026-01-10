package com.mmlimiteds.mithranmillets.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmlimiteds.mithranmillets.dto.UserProfileDTO;
import com.mmlimiteds.mithranmillets.entity.User;
import com.mmlimiteds.mithranmillets.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TC-AUTH Test Suite - Controller Layer Tests
 * Tests API contract validation as specified in TEST_CASES.md
 */
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    private User validUser;
    private User duplicateUser;

    @BeforeEach
    void setUp() {
        validUser = new User();
        validUser.setUsername("testuser");
        validUser.setEmail("test@example.com");
        validUser.setPassword("Test@1234");
        validUser.setFullName("Test User");
        validUser.setPhone("1234567890");
        validUser.setRole("USER");

        duplicateUser = new User();
        duplicateUser.setUsername("existinguser");
        duplicateUser.setEmail("existing@example.com");
        duplicateUser.setPassword("Test@1234");
        duplicateUser.setFullName("Existing User");
        duplicateUser.setRole("USER");
    }

//    @Test
//    @DisplayName("TC-AUTH-001: User Registration - Valid Request")
//    void testUserRegistration_ValidRequest() throws Exception {
//        // Setup
//        Map<String, Object> responseBody = new HashMap<>();
//        responseBody.put("token", "jwt-token-123");
//        responseBody.put("message", "User registered successfully");
//        
//        when(authService.signup(any(User.class)))
//                .thenReturn(ResponseEntity.status(HttpStatus.CREATED).body(responseBody));
//
//        // Execute & Verify
//        mockMvc.perform(post("/auth/signup")
//                        .with(csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(validUser)))
//                .andExpect(status().isCreated())
//                .andExpect(jsonPath("$.token").exists())
//                .andExpect(jsonPath("$.message").value("User registered successfully"));
//    }

//    @Test
//    @DisplayName("TC-AUTH-002: User Registration - Duplicate Username")
//    void testUserRegistration_DuplicateUsername() throws Exception {
//        // Setup
//        Map<String, String> errorBody = new HashMap<>();
//        errorBody.put("message", "User already exists");
//        
//        when(authService.signup(any(User.class)))
//                .thenReturn(ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody));
//
//        // Execute & Verify
//        mockMvc.perform(post("/auth/signup")
//                        .with(csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(duplicateUser)))
//                .andExpect(status().isConflict())
//                .andExpect(jsonPath("$.message").value("User already exists"));
//    }

    @Test
    @DisplayName("TC-AUTH-003: User Registration - Invalid Email Format")
    void testUserRegistration_InvalidEmail() throws Exception {
        User invalidUser = new User();
        invalidUser.setUsername("testuser");
        invalidUser.setEmail("invalid-email"); // Invalid email format
        invalidUser.setPassword("Test@1234");
        invalidUser.setFullName("Test User");
        invalidUser.setRole("USER");

        // Execute & Verify - Validation should fail before reaching service
        mockMvc.perform(post("/auth/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidUser)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-AUTH-004: User Registration - Weak Password")
    void testUserRegistration_WeakPassword() throws Exception {
        User weakPasswordUser = new User();
        weakPasswordUser.setUsername("testuser");
        weakPasswordUser.setEmail("test@example.com");
        weakPasswordUser.setPassword("123"); // Less than 8 characters
        weakPasswordUser.setFullName("Test User");
        weakPasswordUser.setRole("USER");

        // Execute & Verify - Validation should fail
        mockMvc.perform(post("/auth/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weakPasswordUser)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-AUTH-005: User Login - Valid Credentials (Username)")
    void testLogin_ValidCredentials_Username() throws Exception {
        // Setup
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("username", "testuser");
        loginRequest.put("password", "Test@1234");

        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("token", "jwt-token-123");

        when(authService.login(any(Map.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        // Execute & Verify
        mockMvc.perform(post("/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.token").value("jwt-token-123"));
    }

    @Test
    @DisplayName("TC-AUTH-006: User Login - Valid Credentials (Email)")
    void testLogin_ValidCredentials_Email() throws Exception {
        // Setup
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("email", "test@example.com");
        loginRequest.put("password", "Test@1234");

        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("token", "jwt-token-456");

        when(authService.login(any(Map.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        // Execute & Verify
        mockMvc.perform(post("/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("TC-AUTH-007: User Login - Invalid Credentials")
    void testLogin_InvalidCredentials() throws Exception {
        // Setup
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("username", "testuser");
        loginRequest.put("password", "WrongPassword");

        Map<String, String> errorBody = new HashMap<>();
        errorBody.put("message", "Invalid credentials");

        when(authService.login(any(Map.class)))
                .thenReturn(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody));

        // Execute & Verify
        mockMvc.perform(post("/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    @DisplayName("TC-AUTH-008: User Login - Non-existent User")
    void testLogin_NonExistentUser() throws Exception {
        // Setup
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("username", "nonexistent");
        loginRequest.put("password", "Test@1234");

        Map<String, String> errorBody = new HashMap<>();
        errorBody.put("message", "Invalid credentials"); // Generic message to prevent enumeration

        when(authService.login(any(Map.class)))
                .thenReturn(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody));

        // Execute & Verify
        mockMvc.perform(post("/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

//    @Test
//    @DisplayName("TC-AUTH-011: Admin Account Creation")
//    @WithMockUser(roles = "ADMIN")
//    void testAdminAccountCreation() throws Exception {
//        // Setup
//        User newAdmin = new User();
//        newAdmin.setUsername("newadmin");
//        newAdmin.setEmail("admin@example.com");
//        newAdmin.setPassword("Admin@1234");
//        newAdmin.setFullName("New Admin");
//        newAdmin.setRole("ADMIN");
//
//        Map<String, String> responseBody = new HashMap<>();
//        responseBody.put("message", "Admin created successfully");
//
//        when(authService.createAdmin(any(User.class)))
//                .thenReturn(ResponseEntity.status(HttpStatus.CREATED).body(responseBody));
//
//        // Execute & Verify
//        mockMvc.perform(post("/auth/admin/create")
//                        .with(csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(newAdmin)))
//                .andExpect(status().isCreated())
//                .andExpect(jsonPath("$.message").value("Admin created successfully"));
//    }

    @Test
    @DisplayName("TC-AUTH-012: Regular User Cannot Create Admin")
    @WithMockUser(roles = "USER")
    void testRegularUserCannotCreateAdmin() throws Exception {
        // Setup
        User newAdmin = new User();
        newAdmin.setUsername("newadmin");
        newAdmin.setEmail("admin@example.com");
        newAdmin.setPassword("Admin@1234");
        newAdmin.setFullName("New Admin");
        newAdmin.setRole("ADMIN");

        // Execute & Verify - Should be forbidden for regular users
        mockMvc.perform(post("/auth/admin/create")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newAdmin)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-AUTH: Get All Users - Admin Only")
    @WithMockUser(roles = "ADMIN")
    void testGetAllUsers_Admin() throws Exception {
        // Setup
        UserProfileDTO user1 = new UserProfileDTO();
        user1.setUsername("user1");
        UserProfileDTO user2 = new UserProfileDTO();
        user2.setUsername("user2");

        when(authService.getAllUsersForAdmin())
                .thenReturn(List.of(user1, user2));

        // Execute & Verify
        mockMvc.perform(get("/auth/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("TC-AUTH: Get All Users - Regular User Forbidden")
    @WithMockUser(roles = "USER")
    void testGetAllUsers_RegularUser() throws Exception {
        // Execute & Verify
        mockMvc.perform(get("/auth/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-AUTH: Get Profile - Authenticated User")
    @WithMockUser(username = "testuser", roles = "USER")
    void testGetProfile() throws Exception {
        // Setup
        UserProfileDTO profile = new UserProfileDTO();
        profile.setUsername("testuser");
        profile.setEmail("test@example.com");
        profile.setFullName("Test User");

        when(authService.getProfile(any()))
                .thenReturn(ResponseEntity.ok(profile));

        // Execute & Verify
        mockMvc.perform(get("/auth/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));
    }
}
