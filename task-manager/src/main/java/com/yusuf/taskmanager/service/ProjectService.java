package com.yusuf.taskmanager.service;

import com.yusuf.taskmanager.entity.Project;
import com.yusuf.taskmanager.entity.ProjectMember;
import com.yusuf.taskmanager.entity.User;
import com.yusuf.taskmanager.repository.ProjectMemberRepository;
import com.yusuf.taskmanager.repository.ProjectRepository;
import com.yusuf.taskmanager.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectMemberRepository projectMemberRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
    }

    public Project createProject(String name, String description, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        projectRepository.save(project);

        ProjectMember member = new ProjectMember();
        member.setUser(creator);
        member.setProject(project);
        member.setRole(ProjectMember.Role.OWNER);
        projectMemberRepository.save(member);

        return project;
    }

    public List<Project> getMyProjects(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        return projectMemberRepository.findByUser(user)
                .stream()
                .map(ProjectMember::getProject)
                .toList();
    }

    public Project getProjectById(Long projectId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proje bulunamadı"));

        projectMemberRepository.findByUserAndProject(user, project)
                .orElseThrow(() -> new RuntimeException("Bu projenin üyesi değilsiniz"));

        return project;
    }

    public List<ProjectMemberResponse> getProjectMembers(Long projectId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proje bulunamadı"));

        projectMemberRepository.findByUserAndProject(user, project)
                .orElseThrow(() -> new RuntimeException("Bu projenin üyesi değilsiniz"));

        return projectMemberRepository.findByProject(project)
                .stream()
                .map(m -> new ProjectMemberResponse(
                        m.getId(),
                        m.getUser().getId(),
                        m.getUser().getEmail(),
                        m.getUser().getName(),
                        m.getRole()
                ))
                .toList();
    }

    public ProjectMemberResponse addMember(Long projectId, String newMemberEmail, ProjectMember.Role role, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proje bulunamadı"));

        projectMemberRepository.findByUserAndProject(requester, project)
                .orElseThrow(() -> new RuntimeException("Bu projenin üyesi değilsiniz"));

        User newMemberUser = userRepository.findByEmail(newMemberEmail)
                .orElseThrow(() -> new RuntimeException("Eklenmek istenen email ile kayıtlı kullanıcı bulunamadı"));

        if (projectMemberRepository.findByUserAndProject(newMemberUser, project).isPresent()) {
            throw new RuntimeException("Bu kullanıcı zaten bu projenin üyesi");
        }

        ProjectMember newMember = new ProjectMember();
        newMember.setUser(newMemberUser);
        newMember.setProject(project);
        newMember.setRole(role != null ? role : ProjectMember.Role.MEMBER);
        ProjectMember saved = projectMemberRepository.save(newMember);

        return new ProjectMemberResponse(
                saved.getId(),
                newMemberUser.getId(),
                newMemberUser.getEmail(),
                newMemberUser.getName(),
                saved.getRole()
        );
    }

    public void removeMember(Long projectId, Long memberId, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proje bulunamadı"));

        ProjectMember requesterMember = projectMemberRepository.findByUserAndProject(requester, project)
                .orElseThrow(() -> new RuntimeException("Bu projenin üyesi değilsiniz"));

        ProjectMember targetMember = projectMemberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Üye bulunamadı"));

        if (!targetMember.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Bu üye bu projeye ait değil");
        }

        if (!requesterMember.getRole().equals(ProjectMember.Role.OWNER) && !targetMember.getUser().getId().equals(requester.getId())) {
            throw new RuntimeException("Üyeyi çıkarma yetkiniz yok");
        }

        if (targetMember.getRole().equals(ProjectMember.Role.OWNER)) {
            long ownerCount = projectMemberRepository.findByProject(project).stream()
                    .filter(m -> m.getRole().equals(ProjectMember.Role.OWNER))
                    .count();
            if (ownerCount <= 1) {
                throw new RuntimeException("Projede en az bir sahip (OWNER) kalmalıdır");
            }
        }

        projectMemberRepository.delete(targetMember);
    }

    public record ProjectMemberResponse(Long id, Long userId, String email, String name, ProjectMember.Role role) {}
}
