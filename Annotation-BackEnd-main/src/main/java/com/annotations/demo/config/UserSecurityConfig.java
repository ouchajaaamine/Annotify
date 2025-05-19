package com.annotations.demo.config;

import com.annotations.demo.service.UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuration de la gestion des utilisateurs et de l'authentification
 * Configure les beans nécessaires pour l'authentification
 */
@Configuration
public class UserSecurityConfig {

    private final UserService userService;

    public UserSecurityConfig(UserService userService) {
        this.userService = userService;
    }

    /**
     * Configure le service de détails utilisateur
     * @return Service de détails utilisateur personnalisé
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userService.loadUserByUsername(username);
    }

    /**
     * Configure le fournisseur d'authentification
     * @return Provider d'authentification configuré
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Configure le gestionnaire d'authentification
     * @return Gestionnaire d'authentification
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Configure l'encodeur de mot de passe
     * @return Encodeur BCrypt pour les mots de passe
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}