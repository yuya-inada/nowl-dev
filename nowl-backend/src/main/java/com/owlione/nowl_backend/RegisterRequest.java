package com.owlione.nowl_backend;

public record RegisterRequest (
  String username, String email, String password, String role
){}
