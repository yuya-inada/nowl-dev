package com.owlione.nowl_backend;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
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
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

        return Jwts.builder()
                .setSubject(String.valueOf(userPrincipal.getId()))
                .claim("role", userPrincipal.getAuthorities().stream()
                        .map(a -> a.getAuthority())
                        .findFirst()
                        .orElse("ROLE_USER"))
                .claim("username", userPrincipal.getUsername())
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
                .build()                       // ← ここでビルド
                .parseClaimsJws(token)         // ← JWSを解析
                .getBody();                     // ← Claimsを取得
    }

    // トークンからユーザーID取得
    public Long getUserIdFromToken(String token) {
        return Long.valueOf(validateToken(token).getSubject());
    }
}