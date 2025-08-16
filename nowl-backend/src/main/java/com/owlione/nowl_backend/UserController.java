package com.owlione.nowl_backend;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ユーザー作成
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @PostMapping
    public User createUser(@RequestBody User request, Authentication authentication) {
        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        String currentRole = currentUser.getAuthorities().iterator().next().getAuthority();

        String requestedRole = request.getRole();
        String role;
        if ("ROLE_SUPERADMIN".equals(requestedRole)) {
            if (!"ROLE_SUPERADMIN".equals(currentRole)) {
                throw new RuntimeException("Only SUPERADMIN can create another SUPERADMIN");
            }
            role = "ROLE_SUPERADMIN";
        } else if ("ROLE_ADMIN".equals(requestedRole)) {
            role = "ROLE_ADMIN";
        } else {
            role = "ROLE_USER";
        }

        return userService.createUser(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                role
        );
    }

    public record UserResponse(Long id, String username, String email, String role, java.time.LocalDateTime createdAt) {}

    // 全ユーザー取得
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERADMIN') or hasRole('USER')")
    @GetMapping
    public List<User> getAllUsers(Authentication authentication) {
        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        System.out.println("Current user: " + currentUser.getUsername() + " / Authorities: " + currentUser.getAuthorities());
    
        boolean isSuperAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPERADMIN".equals(a.getAuthority()));
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    
        if (!isSuperAdmin && !isAdmin) {
            return List.of(userService.getUserById(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("User not found")));
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
            throw new RuntimeException("USER can only view themselves");
        }

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

    // 更新
    @PreAuthorize("hasAnyRole('USER','ADMIN','SUPERADMIN')")
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User request, Authentication authentication) {
        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        String currentRole = currentUser.getAuthorities().iterator().next().getAuthority();

        if ("ROLE_USER".equals(currentRole) && !currentUser.getId().equals(id)) {
            throw new RuntimeException("USER can only edit themselves");
        }

        if ("ROLE_ADMIN".equals(currentRole) && !currentUser.getId().equals(id)) {
            // ADMIN は他ユーザーを編集不可（SUPERADMIN を除く）
            User target = userService.getUserById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if ("ROLE_SUPERADMIN".equals(target.getRole())) {
                throw new RuntimeException("ADMIN cannot edit SUPERADMIN");
            } else {
                throw new RuntimeException("ADMIN can only edit themselves");
            }
        }

        // SUPERADMIN は全員編集可能

        return userService.updateUser(
                id,
                request.getUsername(),
                request.getEmail(),
                request.getPassword()
        );
    }

    // 削除
    @PreAuthorize("hasRole('SUPERADMIN')")
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "Deleted user with id " + id;
    }
}