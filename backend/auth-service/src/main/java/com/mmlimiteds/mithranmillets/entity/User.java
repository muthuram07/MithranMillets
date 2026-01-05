package com.mmlimiteds.mithranmillets.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @NotBlank(message = "Username is required")
    @Size(max = 50, message = "Username must be under 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(USER|ADMIN)$", message = "Role must be USER or ADMIN")
    private String role;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(unique = true)
    private String email;

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be under 100 characters")
    private String fullName;

    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be 10 digits")
    private String phone;

    // --- Password reset fields ---
    // store SHA-256 hex of the reset token (do not store raw token)
    @Column(name = "reset_password_token", length = 128)
    private String resetPasswordToken;

    // expiry instant for the token
    @Column(name = "reset_password_expires")
    private Instant resetPasswordExpires;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getResetPasswordToken() {
        return resetPasswordToken;
    }

    public void setResetPasswordToken(String resetPasswordToken) {
        this.resetPasswordToken = resetPasswordToken;
    }

    public Instant getResetPasswordExpires() {
        return resetPasswordExpires;
    }

    public void setResetPasswordExpires(Instant resetPasswordExpires) {
        this.resetPasswordExpires = resetPasswordExpires;
    }
}
