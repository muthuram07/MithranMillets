package com.mmlimiteds.mithranmillets.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.mmlimiteds.mithranmillets.dto.UserDto;

/**
 * Feign client to call the Auth service internal endpoint to fetch user details.
 * Auth service runs on port 8085 (as you provided).
 */
@FeignClient(name = "auth-service", url = "http://localhost:8085")
public interface UserFeignClient {

    @GetMapping("/auth/internal/user/{username}")
    ResponseEntity<UserDto> getUserByUsername(@PathVariable("username") String username);
}
