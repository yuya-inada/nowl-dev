package com.owlione.nowl_backend;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 役割付きユーザー作成
    public User createUser(String username, String email, String rawPassword, String role) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            throw new IllegalArgumentException("Password must not be null or empty");
        }
        String hashedPassword = passwordEncoder.encode(rawPassword);
        User user = new User(username, email, hashedPassword, role);
        return userRepository.save(user);
    }

    // ID で取得
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // username で取得
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // 全ユーザー取得
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 更新
    public User updateUser(Long id, String username, String email, String rawPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setUsername(username);
        user.setEmail(email);
        if (rawPassword != null && !rawPassword.isEmpty()) {
            String hashedPassword = passwordEncoder.encode(rawPassword);
            user.setPassword(hashedPassword);
        }
        return userRepository.save(user);
    }

    // 削除
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}