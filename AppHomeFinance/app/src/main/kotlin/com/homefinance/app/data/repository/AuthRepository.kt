package com.homefinance.app.data.repository

import com.homefinance.app.core.model.AuthBootstrapState
import com.homefinance.app.core.model.LocalAccount

interface AuthRepository {
    suspend fun bootstrapState(): AuthBootstrapState
    suspend fun createAccount(name: String, email: String, password: String): Result<LocalAccount>
    suspend fun login(email: String, password: String): Result<LocalAccount>
    suspend fun logout()
}
