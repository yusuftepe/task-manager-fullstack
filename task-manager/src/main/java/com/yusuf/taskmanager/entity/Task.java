package com.yusuf.taskmanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter

public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    private Status status = Status.TODO;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    public enum Status {
        TODO, IN_PROGRESS, DONE
    }

}
