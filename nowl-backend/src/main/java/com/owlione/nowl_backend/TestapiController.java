package com.owlione.nowl_backend;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TestapiController {

    @GetMapping("/test-auth")
    public ResponseEntity<?> testAuth(Authentication authentication) {
        return ResponseEntity.ok("Hello " + authentication.getName() + ", you are authenticated!");
    }

    @GetMapping("/user-only")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> userAccess(Authentication authentication) {
        return ResponseEntity.ok("Hello USER " + authentication.getName() + ", you can access this!");
    }

    @GetMapping("/admin-only")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminAccess(Authentication authentication) {
        return ResponseEntity.ok("Hello ADMIN " + authentication.getName() + ", you can access this!");
    }

    @GetMapping("/superadmin-only")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> superAdminAccess(Authentication authentication) {
        return ResponseEntity.ok("Hello SUPERADMIN " + authentication.getName() + ", you can access this!");
    }
}