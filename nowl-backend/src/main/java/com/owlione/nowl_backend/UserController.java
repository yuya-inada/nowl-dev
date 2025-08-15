package com.owlione.nowl_backend;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public User createUser(@RequestBody User request) {
        return userService.createUser(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                "ROLE_USER"
        );
    }

    public record UserResponse(Long id, String username, String email, String role, java.time.LocalDateTime createdAt) {}

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        User targetUser = userService.getUserById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserResponse(
                targetUser.getId(),
                targetUser.getUsername(),
                targetUser.getEmail(),
                targetUser.getRole(),
                targetUser.getCreatedAt()
        );
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User request) {
        return userService.updateUser(
                id,
                request.getUsername(),
                request.getEmail(),
                request.getPassword()
        );
    }

    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "Deleted user with id " + id;
    }
}