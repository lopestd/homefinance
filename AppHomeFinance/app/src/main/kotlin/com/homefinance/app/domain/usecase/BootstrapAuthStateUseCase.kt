package com.homefinance.app.domain.usecase

import com.homefinance.app.core.model.AuthBootstrapState
import com.homefinance.app.data.repository.AuthRepository

class BootstrapAuthStateUseCase(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): AuthBootstrapState {
        return authRepository.bootstrapState()
    }
}

