package com.owlione.nowl_backend;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    // JWT生成
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

        return Jwts.builder()
        .setSubject(userPrincipal.getUsername())
        .claim("role", userPrincipal.getAuthorities().stream()
        .map(GrantedAuthority::getAuthority)
        .findFirst()
        .orElse("ROLE_USER"))
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
    }

    // JWT検証
    public Claims validateToken(String token) {
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // トークンからユーザー名取得
    public String getUsernameFromToken(String token) {
        return validateToken(token).getSubject();
    }
}