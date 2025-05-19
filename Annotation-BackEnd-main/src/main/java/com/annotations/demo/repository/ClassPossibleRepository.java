package com.annotations.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.annotations.demo.entity.ClassPossible;
import com.annotations.demo.entity.Dataset;

@Repository
public interface ClassPossibleRepository extends JpaRepository<ClassPossible, Long> {
    List<ClassPossible> findByDataset(Dataset dataset);
} 