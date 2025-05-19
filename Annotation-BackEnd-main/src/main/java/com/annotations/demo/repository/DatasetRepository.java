package com.annotations.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.annotations.demo.entity.Dataset;

@Repository
public interface DatasetRepository extends JpaRepository<Dataset, Long> {
    Dataset findByName(String name);
} 