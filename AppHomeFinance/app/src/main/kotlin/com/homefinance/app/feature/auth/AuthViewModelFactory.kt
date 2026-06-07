package com.homefinance.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.homefinance.app.domain.usecase.BootstrapAuthStateUseCase
import com.homefinance.app.domain.usecase.CreateLocalAccountUseCase
import com.homefinance.app.domain.usecase.LoginLocalUseCase
import com.homefinance.app.domain.usecase.LogoutLocalUseCase

class AuthViewModelFactory(
    private val bootstrapAuthStateUseCase: BootstrapAuthStateUseCase,
    private val createAccountUseCase: CreateLocalAccountUseCase,
    private val loginUseCase: LoginLocalUseCase,
    private val logoutUseCase: LogoutLocalUseCase
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AuthViewModel(
                bootstrapAuthStateUseCase = bootstrapAuthStateUseCase,
                createAccountUseCase = createAccountUseCase,
                loginUseCase = loginUseCase,
                logoutUseCase = logoutUseCase
            ) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
