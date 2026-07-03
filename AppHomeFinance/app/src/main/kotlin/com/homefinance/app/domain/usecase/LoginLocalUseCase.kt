package com.homefinance.app.domain.usecase

import com.homefinance.app.core.model.LocalAccount
import com.homefinance.app.data.repository.AuthRepository

class LoginLocalUseCase(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(userId: Long): Result<LocalAccount> {
        return authRepository.selectProfile(userId)
    }
}
