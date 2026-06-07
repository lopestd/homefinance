package com.homefinance.app.domain.usecase

import com.homefinance.app.data.repository.AuthRepository

class LogoutLocalUseCase(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke() {
        authRepository.logout()
    }
}
