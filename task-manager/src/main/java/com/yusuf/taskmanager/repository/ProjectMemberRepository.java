package com.yusuf.taskmanager.repository;

import com.yusuf.taskmanager.entity.Project;
import com.yusuf.taskmanager.entity.ProjectMember;
import com.yusuf.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByUser(User user);
    List<ProjectMember> findByProject(Project project);
    Optional<ProjectMember> findByUserAndProject(User user, Project project);
}
