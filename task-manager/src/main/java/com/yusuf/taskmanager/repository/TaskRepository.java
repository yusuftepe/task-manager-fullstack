package com.yusuf.taskmanager.repository;

import com.yusuf.taskmanager.entity.Project;
import com.yusuf.taskmanager.entity.ProjectMember;
import com.yusuf.taskmanager.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject(Project project);
}
