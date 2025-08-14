package com.owlione.nowl_backend;

import org.springframework.security.core.userdetails.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

    // ← ここにログを追加
    System.out.println("loadUserByUsername: username=" + user.getUsername() + ", role=" + user.getRole());

    return new org.springframework.security.core.userdetails.User(
        user.getUsername(),
        user.getPassword(),
        List.of(new SimpleGrantedAuthority(user.getRole()))
    );
}
}