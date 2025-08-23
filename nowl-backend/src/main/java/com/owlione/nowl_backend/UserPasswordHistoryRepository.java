package com.owlione.nowl_backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserPasswordHistoryRepository extends JpaRepository<UserPasswordHistory, Long> {
    List<UserPasswordHistory> findByUserId(Long userId);
}