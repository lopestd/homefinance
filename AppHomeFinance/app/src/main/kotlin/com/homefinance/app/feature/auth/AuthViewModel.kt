package com.homefinance.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homefinance.app.core.validation.validateDisplayName
import com.homefinance.app.core.validation.validateEmail
import com.homefinance.app.domain.usecase.BootstrapAuthStateUseCase
import com.homefinance.app.domain.usecase.CreateLocalAccountUseCase
import com.homefinance.app.domain.usecase.LoginLocalUseCase
import com.homefinance.app.domain.usecase.LogoutLocalUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class AuthViewModel(
    private val bootstrapAuthStateUseCase: BootstrapAuthStateUseCase,
    private val createAccountUseCase: CreateLocalAccountUseCase,
    private val loginUseCase: LoginLocalUseCase,
    private val logoutUseCase: LogoutLocalUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        loadAuthState()
    }

    private fun loadAuthState() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, message = null) }
            val state = bootstrapAuthStateUseCase()
            _uiState.update {
                it.copy(
                    isLoading = false,
                    hasLocalAccount = state.hasLocalAccount,
                    isAuthenticated = state.isAuthenticated,
                    accountName = state.accountName,
                    userId = state.userId,
                    profiles = state.profiles
                )
            }
        }
    }

    fun handleRestoreCompleted() {
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = true,
                    isAuthenticated = false,
                    userId = null,
                    accountName = "",
                    message = null
                )
            }
            val state = bootstrapAuthStateUseCase()
            _uiState.update {
                it.copy(
                    isLoading = false,
                    hasLocalAccount = state.hasLocalAccount,
                    isAuthenticated = false,
                    accountName = "",
                    userId = null,
                    profiles = state.profiles,
                    message = "Backup restaurado. Selecione um perfil."
                )
            }
        }
    }

    fun createProfile(name: String, email: String) {
        val nameError = validateDisplayName(name)
        val emailError = validateEmail(email)
        val validationError = nameError ?: emailError
        if (validationError != null) {
            _uiState.update { it.copy(message = validationError) }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, message = null) }
            val result = createAccountUseCase(
                name = name.trim(),
                email = email.trim()
            )
            _uiState.update { current ->
                result.fold(
                    onSuccess = {
                        current.copy(
                            hasLocalAccount = true,
                            isAuthenticated = true,
                            userId = it.userId,
                            accountName = it.displayName,
                            profiles = current.profiles + it.toProfile(),
                            isSaving = false,
                            message = "Perfil local criado."
                        )
                    },
                    onFailure = { failure ->
                        current.copy(
                            isSaving = false,
                            message = failure.message ?: "Falha ao criar conta."
                        )
                    }
                )
            }
        }
    }

    fun selectProfile(userId: Long) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, message = null) }
            val result = loginUseCase(userId)
            _uiState.update { current ->
                result.fold(
                    onSuccess = { account ->
                        current.copy(
                            hasLocalAccount = true,
                            isAuthenticated = true,
                            userId = account.userId,
                            accountName = account.displayName,
                            isSaving = false,
                            message = null
                        )
                    },
                    onFailure = { failure ->
                        current.copy(
                            isSaving = false,
                            message = failure.message ?: "Falha ao entrar."
                        )
                    }
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            logoutUseCase()
            _uiState.update {
                it.copy(
                    isAuthenticated = false,
                    userId = null,
                    accountName = "",
                    message = "Sessão local encerrada."
                )
            }
        }
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null) }
    }

    private fun com.homefinance.app.core.model.LocalAccount.toProfile(): com.homefinance.app.core.model.LocalProfile {
        return com.homefinance.app.core.model.LocalProfile(
            userId = userId,
            displayName = displayName,
            email = email
        )
    }
}
