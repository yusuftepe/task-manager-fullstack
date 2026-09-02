package com.yusuf.taskmanager.service;

import com.yusuf.taskmanager.entity.Project;
import com.yusuf.taskmanager.entity.Task;
import com.yusuf.taskmanager.entity.User;
import com.yusuf.taskmanager.repository.ProjectMemberRepository;
import com.yusuf.taskmanager.repository.ProjectRepository;
import com.yusuf.taskmanager.repository.TaskRepository;
import com.yusuf.taskmanager.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       ProjectMemberRepository projectMemberRepository,
                       UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
    }

    private void checkMembership(User user, Project project) {
        projectMemberRepository.findByUserAndProject(user, project)
                .orElseThrow(() -> new RuntimeException("Bu projenin üyesi değilsin"));
    }

    public Task createTask(Long projectId, String title, String description, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proje bulunamadı"));

        checkMembership(user, project);

        Task task = new Task();
        task.setTitle(title);
        task.setDescription(description);
        task.setProject(project);

        return taskRepository.save(task);
    }

    public List<Task> getProjectTasks(Long projectId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proje bulunamadı"));

        checkMembership(user, project);

        return taskRepository.findByProject(project);
    }

    public Task updateTaskStatus(Long projectId, Long taskId, Task.Status newStatus, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proje bulunamadı"));

        checkMembership(user, project);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Görev bulunamadı"));

        if (!task.getProject().getId().equals(project.getId())) {
            throw new RuntimeException("Bu görev bu projeye ait değil");
        }

        task.setStatus(newStatus);
        return taskRepository.save(task);
    }
}