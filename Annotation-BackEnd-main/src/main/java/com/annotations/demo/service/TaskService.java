package com.annotations.demo.service;

import com.annotations.demo.entity.Task;
import org.springframework.stereotype.Service;

import java.util.List;


public interface TaskService {
    Task findTaskById(Long id);
    List<Task> findAllTasks();
    List<Task> findAllTasksByAnnotateurId(Long id);
    String getSelectedClassId(Long taskId, Long coupleId, Long annotateurId);
    long countActiveTasks();
}
