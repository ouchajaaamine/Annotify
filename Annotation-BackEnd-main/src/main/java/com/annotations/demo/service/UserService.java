package com.annotations.demo.service;

import java.util.ArrayList;
import java.util.List;

import com.annotations.demo.entity.Annotateur;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.annotations.demo.entity.User;
import com.annotations.demo.repository.UserRepository;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByLogin(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getRole().name()));
        
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getLogin())
                .password(user.getPassword())
                .authorities(authorities)
                .build();
    }
    public User getCurrentAnnotateur() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated() &&
                !(authentication.getPrincipal() instanceof String)) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();

            // Assuming you have a method to find Annotateur by username in your repository
            return userRepository.findByLogin(username);
        }
        return null;
    }
    public Long getCurrentAnnotateurId() {
        User annotateur = getCurrentAnnotateur();
        return annotateur != null ? annotateur.getId() : null;
    }
    public String getCurrentUserName() {
        User annotateur = getCurrentAnnotateur();
        return annotateur != null ? annotateur.getNom() : null;
    }



}
