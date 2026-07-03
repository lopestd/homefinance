package com.homefinance.app.core.model

data class AuthBootstrapState(
    val hasLocalAccount: Boolean,
    val isAuthenticated: Boolean,
    val accountName: String,
    val userId: Long?,
    val profiles: List<LocalProfile> = emptyList()
)
