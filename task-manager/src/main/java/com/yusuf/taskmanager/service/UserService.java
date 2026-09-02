package com.yusuf.taskmanager.service;

import com.yusuf.taskmanager.entity.User;
import com.yusuf.taskmanager.repository.UserRepository;
import com.yusuf.taskmanager.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public User register(String email, String rawPassword, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Bu email zaten kayıtlı");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setName(name);

        return userRepository.save(user);
    }

    public String login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email veya şifre hatalı"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Email veya şifre hatalı");
        }

        return jwtService.generateToken(user.getEmail());
    }
}