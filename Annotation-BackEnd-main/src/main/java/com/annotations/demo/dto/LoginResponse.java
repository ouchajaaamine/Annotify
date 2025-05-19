package com.annotations.demo.dto;

public class LoginResponse {
    private String message;
    private String token; // Ou d'autres informations pertinentes après le login
    private String userRole;

    // Constructor
    public LoginResponse(String message, String token, String userRole) {
        this.message = message;
        this.token = token;
        this.userRole = userRole;
    }

    public LoginResponse(String message, String userRole) {
        this.message = message;
        this.userRole = userRole;
    }


    // Getters and Setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }
}