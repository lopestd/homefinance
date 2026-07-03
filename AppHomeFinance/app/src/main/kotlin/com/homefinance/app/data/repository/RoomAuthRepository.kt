package com.homefinance.app.data.repository

import androidx.room.withTransaction
import com.homefinance.app.core.model.AuthBootstrapState
import com.homefinance.app.core.model.LocalAccount
import com.homefinance.app.core.model.LocalProfile
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
        removeLegacyDefaultTestProfile()
        val hasLocalAccount = userDao.countUsers() > 0
        val profiles = userDao.listActiveUsers().map { it.toLocalProfile() }
        val activeSession = sessionDao.getActiveSession()
            ?: return AuthBootstrapState(
                hasLocalAccount = hasLocalAccount,
                isAuthenticated = false,
                accountName = "",
                userId = null,
                profiles = profiles
            )

        val account = userDao.findById(activeSession.userId)
        if (account == null) {
            sessionDao.deactivateAllSessions()
            return AuthBootstrapState(
                hasLocalAccount = hasLocalAccount,
                isAuthenticated = false,
                accountName = "",
                userId = null,
                profiles = profiles
            )
        }

        return AuthBootstrapState(
            hasLocalAccount = true,
            isAuthenticated = true,
            accountName = account.displayName,
            userId = account.id,
            profiles = profiles
        )
    }

    override suspend fun createProfile(
        name: String,
        email: String
    ): Result<LocalAccount> {
        val normalizedEmail = email.trim().lowercase()
        val normalizedName = name.trim()
        val now = System.currentTimeMillis().toString()

        return try {
            val existing = userDao.findByEmail(normalizedEmail)
            if (existing != null) {
                return Result.failure(IllegalStateException("Já existe um perfil com este e-mail."))
            }

            val salt = LOCAL_PROFILE_SALT
            val passwordHash = LOCAL_PROFILE_HASH
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
                        name = "Salário",
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

    override suspend fun selectProfile(userId: Long): Result<LocalAccount> {
        val account = userDao.findById(userId)
            ?: return Result.failure(IllegalArgumentException("Perfil não encontrado."))
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

    private suspend fun removeLegacyDefaultTestProfile() {
        val legacyProfile = userDao.findByEmail(LEGACY_TEST_PROFILE_EMAIL)
        if (legacyProfile?.displayName != LEGACY_TEST_PROFILE_NAME) {
            return
        }
        database.withTransaction {
            val userId = legacyProfile.id.toString()
            val args = arrayOf(userId)
            val db = database.openHelper.writableDatabase
            LEGACY_USER_TABLES.forEach { table ->
                db.delete(table, "id_usuario = ?", args)
            }
            db.delete("usuarios", "id_usuario = ?", args)
        }
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

    private fun UserEntity.toLocalProfile(): LocalProfile {
        return LocalProfile(
            userId = id,
            displayName = displayName,
            email = email
        )
    }

    private companion object {
        const val LOCAL_PROFILE_SALT = "local-profile"
        const val LOCAL_PROFILE_HASH = "local-profile"
        const val LEGACY_TEST_PROFILE_NAME = "Teste"
        const val LEGACY_TEST_PROFILE_EMAIL = "teste@email.com"

        val LEGACY_USER_TABLES = listOf(
            "sessoes",
            "orcamentos",
            "orcamento_meses",
            "saldo_inicial_orcamento",
            "categorias",
            "gastos_predefinidos",
            "tipos_receita",
            "receitas",
            "receitas_meses",
            "despesas",
            "despesas_meses",
            "cartoes",
            "cartao_limites_mensais",
            "cartao_faturas_fechadas",
            "lancamentos_cartao",
            "lancamentos_cartao_meses",
            "audit_log",
            "cartao_meses",
            "cartao_lancamentos"
        )
    }
}
