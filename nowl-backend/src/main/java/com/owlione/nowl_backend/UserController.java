package com.owlione.nowl_backend;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ユーザー作成は誰でも可能
    @PostMapping
    public User createUser(@RequestBody User request) {
        // 新規作成は ROLE_USER を固定で付与
        return userService.createUser(
            request.getUsername(),
            request.getEmail(),
            request.getPassword(),
            "ROLE_USER"
        );
    }

    // パスワードを返さないためのレスポンスDTO
    public record UserResponse(Long id, String username, String email, String role, java.time.LocalDateTime createdAt) {}

    // 特定ユーザー取得（認証済みなら可能）
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id, Authentication authentication) {
        // ログイン中のユーザーを取得
        User currentUser = userService.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        // 自分以外のユーザーを見ようとしていて、ADMINでもSUPERADMINでもなければ拒否
        if (!currentUser.getId().equals(id) &&
            !(currentUser.getRole().equals("ROLE_ADMIN") || currentUser.getRole().equals("ROLE_SUPERADMIN"))) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }

        // 対象ユーザー取得
        User targetUser = userService.getUserById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // パスワードを除外して返却
        return new UserResponse(
            targetUser.getId(),
            targetUser.getUsername(),
            targetUser.getEmail(),
            targetUser.getRole(),
            targetUser.getCreatedAt()
        );
    }

    // すべてのユーザー取得（ADMIN以上）
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERADMIN')")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // ユーザー更新（認証済みなら可能）
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User request) {
        return userService.updateUser(
            id,
            request.getUsername(),
            request.getEmail(),
            request.getPassword()
        );
    }

    // ユーザー削除（SUPERADMINのみ）
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "Deleted user with id " + id;
    }
}