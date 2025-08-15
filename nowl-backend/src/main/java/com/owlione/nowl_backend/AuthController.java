package com.owlione.nowl_backend;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserService userService;
    private final UserDetailsServiceImpl userDetailsService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtils jwtUtils,
                          UserService userService,
                          UserDetailsServiceImpl userDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userService = userService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("LoginRequest received: username=" + request.username() + ", password=" + request.password());

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
        } catch (Exception e) {
            e.printStackTrace(); // ここで例外が出ているか確認
            return ResponseEntity.status(403).body("Authentication failed: " + e.getMessage());
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        // ここで role を取得して　JWT にセット
        // UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        // String role = userDetails.getAuthorities().stream()
        //                         .map(a -> a.getAuthority())
        //                         .findFirst().orElse("ROLE_USER");
        String jwt = jwtUtils.generateToken(authentication);
        return ResponseEntity.ok(new JwtResponse(jwt));
    }

    @PostMapping("/test-password-db")
    public ResponseEntity<?> testPasswordDb(@RequestBody PasswordCheckRequest request) {
        String username = request.username();
        String rawPassword = request.password();

        UserDetails user = userDetailsService.loadUserByUsername(username);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        String dbHash = user.getPassword();
        boolean matches = new BCryptPasswordEncoder().matches(rawPassword.trim(), dbHash.trim());

        return ResponseEntity.ok("Password matches: " + matches);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userService.findByUsername(request.username()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        // 渡された role をそのまま使用。無ければ ROLE_USER をデフォルト
        String role = request.role() != null ? request.role() : "ROLE_USER";

        userService.createUser(request.username(), request.email(), request.password(), role);
        return ResponseEntity.ok("User registered: " + request.username());
    }
}