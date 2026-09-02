package com.yusuf.taskmanager.controller;

import com.yusuf.taskmanager.entity.Task;
import com.yusuf.taskmanager.service.TaskService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public Task createTask(@PathVariable Long projectId, @RequestBody CreateTaskRequest request) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return taskService.createTask(projectId, request.title(), request.description(), email);
    }

    @GetMapping
    public List<Task> getTasks(@PathVariable Long projectId) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return taskService.getProjectTasks(projectId, email);
    }

    @PatchMapping("/{taskId}/status")
    public Task updateTaskStatus(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestBody UpdateTaskStatusRequest request
    ) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return taskService.updateTaskStatus(projectId, taskId, request.status(), email);
    }

    public record CreateTaskRequest(String title, String description) {}

    public record UpdateTaskStatusRequest(Task.Status status) {}
}
