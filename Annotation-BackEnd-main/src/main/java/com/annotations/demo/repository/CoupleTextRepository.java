package com.annotations.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.annotations.demo.entity.CoupleText;
import com.annotations.demo.entity.Dataset;

@Repository
public interface CoupleTextRepository extends JpaRepository<CoupleText, Long> {
    List<CoupleText> findByDataset(Dataset dataset);
    Page<CoupleText> findByDataset(Dataset dataset, Pageable pageable);
    long countByDatasetId(Long datasetId);
}