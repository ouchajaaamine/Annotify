package com.annotations.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.annotations.demo.entity.Administrator;

import java.util.List;

@Repository
public interface AdministratorRepository extends JpaRepository<Administrator, Long> {
    List<Administrator> findAllByDeleted(boolean isDeleted);
    Administrator findByLogin(String login);
} 