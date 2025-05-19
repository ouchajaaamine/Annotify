package com.annotations.demo.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.annotations.demo.entity.Annotateur;
import com.annotations.demo.entity.Dataset;
import com.annotations.demo.entity.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAnnotateur(Annotateur annotateur);

    List<Task> findByDatasetIdAndAnnotateurId(Long datasetId, Long annotateurId);
    List<Task> findByDataset(Dataset dataset);
    List<Task> findByDateLimiteBefore(Date date);
} 