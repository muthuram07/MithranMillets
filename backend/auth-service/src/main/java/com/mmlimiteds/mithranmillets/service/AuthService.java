package com.mmlimiteds.mithranmillets.service;

import com.mmlimiteds.mithranmillets.dto.UserProfileDTO;
import com.mmlimiteds.mithranmillets.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

public interface AuthService {
    ResponseEntity<?> signup(User user);

    ResponseEntity<?> login(Map<String, String> creds);

    ResponseEntity<UserProfileDTO> getProfile(Authentication authentication);

    ResponseEntity<UserProfileDTO> updateProfile(Authentication authentication, Map<String, Object> updates);

    List<UserProfileDTO> getAllUsersForAdmin();

    // Forgot / Reset password
    ResponseEntity<?> forgotPassword(String email);

    ResponseEntity<?> resetPassword(String token, String newPassword);
    User findByUsername(String username);
}
