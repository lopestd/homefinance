package com.homefinance.app.domain.usecase

import com.homefinance.app.core.model.LocalAccount
import com.homefinance.app.data.repository.AuthRepository

class LoginLocalUseCase(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Result<LocalAccount> {
        return authRepository.login(email, password)
    }
}
