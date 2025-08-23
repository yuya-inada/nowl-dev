package com.owlione.nowl_backend;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserPasswordHistoryRepository historyRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, 
                       UserPasswordHistoryRepository historyRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 新規作成
    public User createUser(String username, String email, String rawPassword, String role) {
        String encodedPassword = passwordEncoder.encode(rawPassword);

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(encodedPassword);
        user.setRole(role);
        User savedUser = userRepository.save(user);

        // パスワード履歴に登録
        UserPasswordHistory history = new UserPasswordHistory();
        history.setUser(savedUser);
        history.setPassword(encodedPassword);
        historyRepository.save(history);

        return savedUser;
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 更新時
    public User updateUser(Long id, String username, String email, String rawPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setUsername(username);
        user.setEmail(email);

        if (rawPassword != null && !rawPassword.isEmpty()) {
            // 過去のパスワードと一致するかチェック
            boolean match = historyRepository.findByUserId(user.getId()).stream()
                    .anyMatch(h -> passwordEncoder.matches(rawPassword, h.getPassword()));

            if (match) {
                throw new RuntimeException("過去と同じパスワードは使用できません");
            }

            String encodedPassword = passwordEncoder.encode(rawPassword);
            user.setPassword(encodedPassword);

            // 履歴に追加
            UserPasswordHistory history = new UserPasswordHistory();
            history.setUser(user);
            history.setPassword(encodedPassword);
            historyRepository.save(history);
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}