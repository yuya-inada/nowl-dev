package com.owlione.nowl_backend;

public record LoginRequest (
  String username, 
  String email,
  String password
){}
