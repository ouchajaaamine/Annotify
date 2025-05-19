package com.annotations.demo.dto;

import com.annotations.demo.entity.Role;

public class UserDto {
    private Long id;
    private String nom;
    private String prenom;
    private String login;
    private Role role;
    private boolean deleted;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    
    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }
    
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}