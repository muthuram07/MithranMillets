package com.mmlimiteds.mithranmillets.dto;

public class UserDto {

    private String username;
    private String role;

    // added fields
    private String email;
    private String fullName;

    public UserDto() { }

    public UserDto(String username, String role) {
        this.username = username;
        this.role = role;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}
