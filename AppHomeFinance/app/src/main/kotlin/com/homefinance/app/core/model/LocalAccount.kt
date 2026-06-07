package com.homefinance.app.core.model

data class LocalAccount(
    val userId: Long,
    val displayName: String,
    val email: String,
    val passwordHash: String,
    val salt: String
)
