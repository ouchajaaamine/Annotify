package com.annotations.demo.service;

import com.annotations.demo.dto.UserDto;
import com.annotations.demo.entity.*;
import com.annotations.demo.repository.AnnotateurRepository;
import com.annotations.demo.repository.RoleRepository;
import com.annotations.demo.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class AnnotateurService extends GenericUserService {
    private final AnnotateurRepository annotateurRepository;
    private final RoleRepository roleRepository;

    @Autowired
    public AnnotateurService(UserRepository userRepository,
                             AnnotateurRepository annotateurRepository,
                             PasswordEncoder passwordEncoder,
                             RoleRepository roleRepository) {
        super(userRepository, passwordEncoder);
        this.annotateurRepository = annotateurRepository;
        this.roleRepository = roleRepository;
    }

    @Getter
    @Setter
    public static class SaveAnnotateurResponse {
        private Annotateur user;
        private String generatedPassword;
    }

    public List<Annotateur> findAllActive() {
        return annotateurRepository.findAllByDeleted(false);
    }

    public List<Annotateur> findAll() {
        return annotateurRepository.findAll();
    }

    public List<Annotateur> findAllByIds(List<Long> ids) {
        return annotateurRepository.findAllById(ids);
    }

    public Annotateur findAnnotateurById(Long id) {
        return annotateurRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Annotateur not found with ID: " + id));
    }

    @Override
    @Transactional
    public User saveAnnotateur(UserDto userDto) {
        SaveAnnotateurResponse response = new SaveAnnotateurResponse();

        Annotateur annotateur;
        if (userDto.getId() == null) {
            annotateur = new Annotateur();
            copyDtoToAnnotateur(userDto, annotateur);

            Role userRole = roleRepository.findById(2L)
                    .orElseThrow(() -> new EntityNotFoundException("USER_ROLE with ID 2 not found"));
            annotateur.setRole(userRole);

            String password = generateRandomPassword(12);
            annotateur.setPassword(passwordEncoder.encode(password));
        } else {
            annotateur = annotateurRepository.findById(userDto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Annotateur not found with ID: " + userDto.getId()));
            copyDtoToAnnotateur(userDto, annotateur);
        }

        return annotateurRepository.save(annotateur);
    }

    private void copyDtoToAnnotateur(UserDto dto, Annotateur annotateur) {
        if (dto.getNom() != null) annotateur.setNom(dto.getNom());
        if (dto.getPrenom() != null) annotateur.setPrenom(dto.getPrenom());
        if (dto.getLogin() != null) annotateur.setLogin(dto.getLogin());
        annotateur.setDeleted(dto.isDeleted());
    }

    public String generateRandomPassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public long countActiveAnnotateurs() {
        return annotateurRepository.count();
    }

    public void deleteLogically(Long id) {
        Annotateur annotateur = annotateurRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Annotateur not found with id: " + id));
            
        annotateur.setDeleted(true);
        annotateurRepository.save(annotateur);
    }
    
    public List<Annotateur> findAllByDataset(Dataset dataset) {
        List<Task> tasks = dataset.getTasks();
        List<Annotateur> annotateursAssigned = tasks.stream()
                .filter(task -> task.getAnnotateur() != null)
                .map(Task::getAnnotateur)
                .distinct()
                .collect(Collectors.toList());
        
        return annotateursAssigned;
    }
}