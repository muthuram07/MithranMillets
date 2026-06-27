package com.mmlimiteds.mithranmillets.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.mmlimiteds.mithranmillets.dto.UserDto;

@FeignClient(name = "auth-service", url = "${AUTH_SERVICE_URL:http://localhost:8085}")
public interface UserFeignClient {

    @GetMapping("/auth/internal/user/{username}")
    ResponseEntity<UserDto> getUserByUsername(@PathVariable String username);
}

