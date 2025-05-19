package com.annotations.demo.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_progress")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class TaskProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(name = "last_index")
    private int lastIndex;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    //two params constructor
    public TaskProgress(User user, Task task) {
        this.user = user;
        this.task = task;
        this.lastIndex = 0;
        this.updatedAt = LocalDateTime.now();
    }
}
