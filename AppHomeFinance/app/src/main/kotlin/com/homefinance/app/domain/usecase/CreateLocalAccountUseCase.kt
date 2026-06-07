package com.homefinance.app.domain.usecase

import com.homefinance.app.core.model.LocalAccount
import com.homefinance.app.data.repository.AuthRepository

class CreateLocalAccountUseCase(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(name: String, email: String, password: String): Result<LocalAccount> {
        return authRepository.createAccount(name, email, password)
    }
}
