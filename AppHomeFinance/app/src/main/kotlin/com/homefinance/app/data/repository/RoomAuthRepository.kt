package com.homefinance.app.data.repository

import androidx.room.withTransaction
import com.homefinance.app.core.model.AuthBootstrapState
import com.homefinance.app.core.model.LocalAccount
import com.homefinance.app.core.security.PasswordHasher
import com.homefinance.app.data.local.HomeFinanceDatabase
import com.homefinance.app.data.local.entity.CategoriaEntity
import com.homefinance.app.data.local.entity.OrcamentoEntity
import com.homefinance.app.data.local.entity.SessionEntity
import com.homefinance.app.data.local.entity.UserEntity
import java.util.Calendar

class RoomAuthRepository(
    private val database: HomeFinanceDatabase
) : AuthRepository {
    private val userDao = database.userDao()
    private val sessionDao = database.sessionDao()
    private val budgetDao = database.orcamentoDao()
    private val categoryDao = database.categoriaDao()

    override suspend fun bootstrapState(): AuthBootstrapState {
        val hasLocalAccount = userDao.countUsers() > 0
        val activeSession = sessionDao.getActiveSession()
            ?: return AuthBootstrapState(
                hasLocalAccount = hasLocalAccount,
                isAuthenticated = false,
                accountName = "",
                userId = null
            )

        val account = userDao.findById(activeSession.userId)
        if (account == null) {
            sessionDao.deactivateAllSessions()
            return AuthBootstrapState(
                hasLocalAccount = hasLocalAccount,
                isAuthenticated = false,
                accountName = "",
                userId = null
            )
        }

        return AuthBootstrapState(
            hasLocalAccount = true,
            isAuthenticated = true,
            accountName = account.displayName,
            userId = account.id
        )
    }

    override suspend fun createAccount(
        name: String,
        email: String,
        password: String
    ): Result<LocalAccount> {
        val normalizedEmail = email.trim().lowercase()
        val normalizedName = name.trim()
        val now = System.currentTimeMillis().toString()

        return try {
            val existing = userDao.findByEmail(normalizedEmail)
            if (existing != null) {
                return Result.failure(IllegalStateException("Ja existe uma conta com este email."))
            }

            val salt = PasswordHasher.generateSaltHex()
            val passwordHash = PasswordHasher.hashPassword(password, salt)
            val createdId = database.withTransaction {
                val userId = userDao.insert(
                    UserEntity(
                        displayName = normalizedName,
                        email = normalizedEmail,
                        passwordHash = passwordHash,
                        salt = salt,
                        createdAt = now
                    )
                )
                val currentYear = Calendar.getInstance().get(Calendar.YEAR)
                budgetDao.insert(
                    OrcamentoEntity(
                        userId = userId,
                        year = currentYear,
                        createdAt = now
                    )
                )
                categoryDao.insert(
                    CategoriaEntity(
                        userId = userId,
                        name = "Salario",
                        type = "RECEITA"
                    )
                )
                categoryDao.insert(
                    CategoriaEntity(
                        userId = userId,
                        name = "Moradia",
                        type = "DESPESA"
                    )
                )
                createActiveSession(userId = userId, createdAt = now)
                userId
            }

            Result.success(
                LocalAccount(
                    userId = createdId,
                    displayName = normalizedName,
                    email = normalizedEmail,
                    passwordHash = passwordHash,
                    salt = salt
                )
            )
        } catch (error: Exception) {
            Result.failure(error)
        }
    }

    override suspend fun login(email: String, password: String): Result<LocalAccount> {
        val normalizedEmail = email.trim().lowercase()
        val account = userDao.findByEmail(normalizedEmail)
            ?: return Result.failure(IllegalArgumentException("Email ou senha invalidos."))

        val providedHash = PasswordHasher.hashPassword(password, account.salt)
        if (providedHash != account.passwordHash) {
            return Result.failure(IllegalArgumentException("Email ou senha invalidos."))
        }

        val now = System.currentTimeMillis().toString()
        return try {
            database.withTransaction {
                createActiveSession(userId = account.id, createdAt = now)
            }
            Result.success(account.toLocalAccount())
        } catch (error: Exception) {
            Result.failure(error)
        }
    }

    override suspend fun logout() {
        sessionDao.deactivateAllSessions()
    }

    private suspend fun createActiveSession(userId: Long, createdAt: String) {
        sessionDao.deactivateAllSessions()
        val tokenHash = PasswordHasher.hashValue("${userId}:${PasswordHasher.generateSaltHex(32)}")
        sessionDao.insert(
            SessionEntity(
                userId = userId,
                tokenHash = tokenHash,
                createdAt = createdAt,
                isActive = true
            )
        )
    }

    private fun UserEntity.toLocalAccount(): LocalAccount {
        return LocalAccount(
            userId = id,
            displayName = displayName,
            email = email,
            passwordHash = passwordHash,
            salt = salt
        )
    }
}
