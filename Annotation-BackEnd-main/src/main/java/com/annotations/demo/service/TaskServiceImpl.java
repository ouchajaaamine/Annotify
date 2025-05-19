package com.annotations.demo.service;


import com.annotations.demo.entity.Annotation;
import com.annotations.demo.entity.ClassPossible;
import com.annotations.demo.entity.Task;
import com.annotations.demo.repository.AnnotationRepository;
import com.annotations.demo.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final AnnotateurService annotateurService;
    private final AnnotationRepository annotationRepository;
    public TaskServiceImpl(TaskRepository taskRepository, AnnotateurService annotateurService, AnnotationRepository annotationRepository) {
        this.taskRepository = taskRepository;
        this.annotateurService = annotateurService;
        this.annotationRepository = annotationRepository;
    }


    @Override
    public Task findTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with ID: " + id));
    }
    @Override
    public List<Task> findAllTasks() {
        return taskRepository.findAll() ;

    }

    @Override
    public List<Task> findAllTasksByAnnotateurId(Long id) {
        return taskRepository.findByAnnotateur(annotateurService.findAnnotateurById(id));
    }
    @Override
    public String getSelectedClassId(Long taskId, Long coupleId, Long annotateurId) {
        // Find the annotation for this task, couple, and annotateur
        Optional<Annotation> existingAnnotation = annotationRepository.findByAnnotateurIdAndCoupleTextId(
                annotateurId, coupleId);

        // If an annotation exists, return the chosen class string
        return existingAnnotation.map(Annotation::getChosenClass).orElse(null);
    }

    @Override
    public long countActiveTasks(){
        return taskRepository.count();
    }



}
