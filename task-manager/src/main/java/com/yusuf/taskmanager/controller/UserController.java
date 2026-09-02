package com.yusuf.taskmanager.controller;

import com.yusuf.taskmanager.entity.User;
import com.yusuf.taskmanager.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest request) {
        return userService.register(request.email(), request.password(), request.name());
    }

    public record RegisterRequest(String email, String password, String name) {}
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return userService.login(request.email(), request.password());
    }

    public record LoginRequest(String email, String password) {}
}