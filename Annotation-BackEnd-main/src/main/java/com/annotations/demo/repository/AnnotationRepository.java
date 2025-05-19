package com.annotations.demo.repository;

import java.util.List;
import java.util.Optional;

import com.annotations.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.annotations.demo.entity.Annotateur;
import com.annotations.demo.entity.Annotation;
import com.annotations.demo.entity.CoupleText;

@Repository
public interface AnnotationRepository extends JpaRepository<Annotation, Long> {
    List<Annotation> findByAnnotateur(User user);
    List<Annotation> findByCoupleText(CoupleText coupleText);
    Optional<Annotation> findByAnnotateurIdAndCoupleTextId(Long annotateurId, Long coupleId);

} 