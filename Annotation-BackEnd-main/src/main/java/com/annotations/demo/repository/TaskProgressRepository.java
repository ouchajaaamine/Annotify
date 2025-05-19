package com.annotations.demo.repository;

import com.annotations.demo.entity.Task;
import com.annotations.demo.entity.TaskProgress;
import com.annotations.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface TaskProgressRepository extends JpaRepository<TaskProgress, Long> {
    Optional<TaskProgress> findByUserAndTask(User user, Task task);
    @Query("SELECT tp FROM TaskProgress tp WHERE tp.user = ?1 ORDER BY tp.updatedAt DESC")
    List<TaskProgress> findTopByUserIdOrderByUpdatedAtDesc(User user);
}
