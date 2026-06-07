package com.homefinance.app.feature.auth

data class AuthUiState(
    val isLoading: Boolean = true,
    val hasLocalAccount: Boolean = false,
    val isAuthenticated: Boolean = false,
    val userId: Long? = null,
    val accountName: String = "",
    val isSaving: Boolean = false,
    val message: String? = null
)
