package com.annotations.demo.service;

import com.annotations.demo.entity.CoupleText;
import com.annotations.demo.entity.Dataset;
import com.annotations.demo.repository.CoupleTextRepository;
import com.annotations.demo.repository.DatasetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class CoupleTextServiceImpl implements CoupleTextService {

    private final CoupleTextRepository coupleTextRepository;
    private final DatasetRepository datasetRepository;

    @Autowired
    public CoupleTextServiceImpl(CoupleTextRepository coupleTextRepository,
                                 DatasetRepository datasetRepository) {
        this.coupleTextRepository = coupleTextRepository;
        this.datasetRepository = datasetRepository;
    }

    @Override
    public CoupleText findCoupleTextById(Long id){
        Optional<CoupleText> coupleTextOptional = coupleTextRepository.findById(id);
        return coupleTextOptional.orElse(null);
    }

    @Override
    public Page<CoupleText> getCoupleTexts(int page, int size){
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        return coupleTextRepository.findAll(pageable);
    }

    @Override
    public List<CoupleText> findAllCoupleTextsByDatasetId(Long id){
        Optional<Dataset> datasetOptional = datasetRepository.findById(id);
        if (datasetOptional.isPresent()) {
            Dataset dataset = datasetOptional.get();
            return coupleTextRepository.findByDataset(dataset);
        }
        return Collections.emptyList();
    }

    @Override
    public long countCoupleTextsByDatasetId(Long datasetId) {
        return coupleTextRepository.countByDatasetId(datasetId);
    }

    @Override
    public Page<CoupleText> getCoupleTextsByDatasetId(Long datasetId, int page, int size) {
        Optional<Dataset> datasetOptional = datasetRepository.findById(datasetId);
        if (datasetOptional.isPresent()) {
            Dataset dataset = datasetOptional.get();
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
            return coupleTextRepository.findByDataset(dataset, pageable);
        }
        return Page.empty();
    }

}
