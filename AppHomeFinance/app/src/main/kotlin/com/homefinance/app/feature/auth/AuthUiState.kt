package com.homefinance.app.feature.auth

import com.homefinance.app.core.model.LocalProfile

data class AuthUiState(
    val isLoading: Boolean = true,
    val hasLocalAccount: Boolean = false,
    val isAuthenticated: Boolean = false,
    val userId: Long? = null,
    val accountName: String = "",
    val profiles: List<LocalProfile> = emptyList(),
    val isSaving: Boolean = false,
    val message: String? = null
)
