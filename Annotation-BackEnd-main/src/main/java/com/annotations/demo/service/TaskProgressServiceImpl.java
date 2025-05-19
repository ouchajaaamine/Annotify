package com.annotations.demo.service;

import com.annotations.demo.entity.Task;
import com.annotations.demo.entity.TaskProgress;
import com.annotations.demo.entity.User;
import com.annotations.demo.repository.TaskProgressRepository;
import com.annotations.demo.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TaskProgressServiceImpl implements TaskProgressService {

    private final TaskProgressRepository taskProgressRepository;
    private final TaskRepository taskRepository;

    @Autowired
    public TaskProgressServiceImpl(TaskProgressRepository taskProgressRepository, TaskRepository taskRepository) {
        this.taskProgressRepository = taskProgressRepository;
        this.taskRepository = taskRepository;
    }

    public Optional<TaskProgress> getProgressForUserAndTask(User user, Long taskId) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task not found"));
        return taskProgressRepository.findByUserAndTask(user, task);
    }

    public void saveOrUpdateProgress(User user, Long taskId, int index) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task not found"));
        TaskProgress progress = taskProgressRepository.findByUserAndTask(user, task)
                .orElse(new TaskProgress(user, task));

        progress.setLastIndex(index);
        progress.setUpdatedAt(LocalDateTime.now());
        taskProgressRepository.save(progress);
    }
    @Override
    public TaskProgress getLastAnnotationByUser(User user) {
        List<TaskProgress> progressList = taskProgressRepository.findTopByUserIdOrderByUpdatedAtDesc(user);
        return progressList.isEmpty() ? null : progressList.get(0);
    }
}
