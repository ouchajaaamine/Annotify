package com.annotations.demo.service;

import com.annotations.demo.entity.TaskProgress;
import com.annotations.demo.entity.User;
import java.util.Optional;

public interface TaskProgressService {
    Optional<TaskProgress> getProgressForUserAndTask(User user, Long taskId);
    void saveOrUpdateProgress(User user, Long taskId, int index);
    TaskProgress getLastAnnotationByUser(User user);
}
