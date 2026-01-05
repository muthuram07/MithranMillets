package com.mmlimiteds.mithranmillets.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.mmlimiteds.mithranmillets.entity.User;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByResetPasswordToken(String resetPasswordToken);
}
