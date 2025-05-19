package com.annotations.demo.service;

import com.annotations.demo.entity.Annotation;
import com.annotations.demo.entity.User;

import java.time.LocalDateTime;
import java.util.List;

public interface AnnotationService {
    void saveAnnotation(String text, Long coupleId, Long annotateurId);
    long countTotalAnnotations();
    Integer countAnnotationsByDataset(Long id);
    List<Annotation> findAllAnnotationsByUser(User user);

   
}
