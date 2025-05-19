package com.annotations.demo.service;

import com.annotations.demo.entity.User;
import com.annotations.demo.repository.UserRepository;
import com.annotations.demo.dto.UserDto;
import org.springframework.security.crypto.password.PasswordEncoder;

public abstract class GenericUserService {
    protected final UserRepository userRepository;
    protected final PasswordEncoder passwordEncoder;

    public GenericUserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public abstract User saveAnnotateur(UserDto user);
}