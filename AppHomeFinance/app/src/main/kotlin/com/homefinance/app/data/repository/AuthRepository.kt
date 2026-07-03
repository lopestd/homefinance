package com.homefinance.app.data.repository

import com.homefinance.app.core.model.AuthBootstrapState
import com.homefinance.app.core.model.LocalAccount

interface AuthRepository {
    suspend fun bootstrapState(): AuthBootstrapState
    suspend fun createProfile(name: String, email: String): Result<LocalAccount>
    suspend fun selectProfile(userId: Long): Result<LocalAccount>
    suspend fun logout()
}
