package com.owlione.nowl_backend;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;  // ←追加
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public JwtAuthenticationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // ─── 追加部分 ───
        String path = request.getRequestURI();
        System.out.println("JwtAuthenticationFilter path: " + path);

        // /auth/test-password だけ JWT チェックをスキップ
        if (path.equals("/auth/test-password")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                var claims = jwtUtils.validateToken(token);
                String username = claims.getSubject();
                String role = claims.get("role", String.class);

                System.out.println("JWT username: " + username + ", role: " + role);
                // role の値がすでに ROLE_ で始まっていたらそのまま、そうでなければ付与
                String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                var auth = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    List.of(new SimpleGrantedAuthority(authority))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
                System.out.println("Authentication set: " + SecurityContextHolder.getContext().getAuthentication());

            } catch (Exception e) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}