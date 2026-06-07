package com.homefinance.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homefinance.app.core.validation.validateDisplayName
import com.homefinance.app.core.validation.validateEmail
import com.homefinance.app.core.validation.validatePassword
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
                    userId = state.userId
                )
            }
        }
    }

    fun createAccount(name: String, email: String, password: String) {
        val nameError = validateDisplayName(name)
        val emailError = validateEmail(email)
        val passwordError = validatePassword(password)
        val validationError = nameError ?: emailError ?: passwordError
        if (validationError != null) {
            _uiState.update { it.copy(message = validationError) }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, message = null) }
            val result = createAccountUseCase(
                name = name.trim(),
                email = email.trim(),
                password = password
            )
            _uiState.update { current ->
                result.fold(
                    onSuccess = {
                        current.copy(
                            hasLocalAccount = true,
                            isAuthenticated = true,
                            userId = it.userId,
                            accountName = it.displayName,
                            isSaving = false,
                            message = "Conta local criada com sucesso."
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

    fun login(email: String, password: String) {
        val emailError = validateEmail(email)
        val passwordError = validatePassword(password)
        val validationError = emailError ?: passwordError
        if (validationError != null) {
            _uiState.update { it.copy(message = validationError) }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, message = null) }
            val result = loginUseCase(email.trim(), password)
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
                    message = "Sessao local encerrada."
                )
            }
        }
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null) }
    }
}
