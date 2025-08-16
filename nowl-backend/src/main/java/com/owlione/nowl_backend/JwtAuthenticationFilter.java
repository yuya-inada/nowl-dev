package com.owlione.nowl_backend;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;
import io.jsonwebtoken.Claims;                    // JWT Claims
import org.springframework.security.core.GrantedAuthority;  // Spring Security 権限
import org.springframework.security.core.authority.SimpleGrantedAuthority; // 単一権限
import java.util.List;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    public JwtAuthenticationFilter(JwtUtils jwtUtils, UserDetailsServiceImpl userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        // 認証不要のパスをスキップ
        if (path.equals("/") || path.startsWith("/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        String headerAuth = request.getHeader("Authorization");

        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            String token = headerAuth.substring(7);

            try {
                Long userId = jwtUtils.getUserIdFromToken(token);
                var userDetails = userDetailsService.loadUserById(userId);

                Claims claims = jwtUtils.validateToken(token);
                String role = claims.get("role", String.class); // JWT の role を取得
                List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));

                var authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        authorities
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                logger.error("Cannot set user authentication: {}", e);
            }
        }

        filterChain.doFilter(request, response);
    }
}