package com.owlione.nowl_backend;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ───────────── ユーザー作成 ─────────────
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @PostMapping
    public User createUser(@RequestBody User request, Authentication authentication) {
        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        String currentRole = currentUser.getAuthorities().iterator().next().getAuthority();

        String requestedRole = request.getRole();
        String role;
        if ("ROLE_SUPERADMIN".equals(requestedRole)) {
            if (!"ROLE_SUPERADMIN".equals(currentRole)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only SUPERADMIN can create another SUPERADMIN");
            }
            role = "ROLE_SUPERADMIN";
        } else if ("ROLE_ADMIN".equals(requestedRole)) {
            role = "ROLE_ADMIN";
        } else {
            role = "ROLE_USER";
        }

        // 重複チェック
        if (userService.findByUsername(request.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ユーザー名は既に使われています");
        }
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "メールアドレスは既に使われています");
        }

        try {
            return userService.createUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    role
            );
        } catch (RuntimeException e) {
            // ログに出力
            System.out.println("[UserController.createUser] Exception: " + e.getMessage());
            // フロントに 500 として返す
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public record UserResponse(
            Long id,
            String username,
            String email,
            String role,
            java.time.LocalDateTime createdAt) {}

    // 全ユーザー取得
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERADMIN') or hasRole('USER')")
    @GetMapping
    public List<User> getAllUsers(Authentication authentication) {
        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        boolean isSuperAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPERADMIN".equals(a.getAuthority()));
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        if (!isSuperAdmin && !isAdmin) {
            return List.of(userService.getUserById(currentUser.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
        }

        return userService.getAllUsers();
    }

    // 個別取得
    @PreAuthorize("hasAnyRole('USER','ADMIN','SUPERADMIN')")
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        String currentRole = currentUser.getAuthorities().iterator().next().getAuthority();

        if ("ROLE_USER".equals(currentRole) && !currentUser.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "USER can only view themselves");
        }

        User targetUser = userService.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return new UserResponse(
                targetUser.getId(),
                targetUser.getUsername(),
                targetUser.getEmail(),
                targetUser.getRole(),
                targetUser.getCreatedAt()
        );
    }

    // 更新
    @PreAuthorize("hasAnyRole('USER','ADMIN','SUPERADMIN')")
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User request, Authentication authentication) {
        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        String currentRole = currentUser.getAuthorities().iterator().next().getAuthority();

        if ("ROLE_USER".equals(currentRole) && !currentUser.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "USER can only edit themselves");
        }

        if ("ROLE_ADMIN".equals(currentRole) && !currentUser.getId().equals(id)) {
            User target = userService.getUserById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            if ("ROLE_SUPERADMIN".equals(target.getRole())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN cannot edit SUPERADMIN");
            } else {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN can only edit themselves");
            }
        }

        userService.findByUsername(request.getUsername())
            .filter(u -> !u.getId().equals(id))
            .ifPresent(u -> { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ユーザー名は既に使われています"); });

        userService.findByEmail(request.getEmail())
                .filter(u -> !u.getId().equals(id))
                .ifPresent(u -> { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "メールアドレスは既に使われています"); });

        try {
            return userService.updateUser(
                    id,
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword()
            );
        } catch (RuntimeException e) {
            System.out.println("[UserController.updateUser] Exception: " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // 削除
    @PreAuthorize("hasRole('SUPERADMIN')")
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "Deleted user with id " + id;
    }
}