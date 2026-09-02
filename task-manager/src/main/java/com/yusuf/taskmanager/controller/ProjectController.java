package com.yusuf.taskmanager.controller;

import com.yusuf.taskmanager.entity.Project;
import com.yusuf.taskmanager.entity.ProjectMember;
import com.yusuf.taskmanager.service.ProjectService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public Project createProject(@RequestBody CreateProjectRequest request) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return projectService.createProject(request.name(), request.description(), email);
    }

    public record CreateProjectRequest(String name, String description) {}

    @GetMapping
    public List<Project> getMyProjects() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return projectService.getMyProjects(email);
    }

    @GetMapping("/{projectId}")
    public Project getProjectById(@PathVariable Long projectId) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return projectService.getProjectById(projectId, email);
    }

    @GetMapping("/{projectId}/members")
    public List<ProjectService.ProjectMemberResponse> getMembers(@PathVariable Long projectId) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return projectService.getProjectMembers(projectId, email);
    }

    @PostMapping("/{projectId}/members")
    public ProjectService.ProjectMemberResponse addMember(
            @PathVariable Long projectId,
            @RequestBody AddMemberRequest request
    ) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return projectService.addMember(projectId, request.email(), request.role(), email);
    }

    @DeleteMapping("/{projectId}/members/{memberId}")
    public void removeMember(
            @PathVariable Long projectId,
            @PathVariable Long memberId
    ) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        projectService.removeMember(projectId, memberId, email);
    }

    public record AddMemberRequest(String email, ProjectMember.Role role) {}
}
