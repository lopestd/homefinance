package com.homefinance.app.data.repository

import androidx.room.withTransaction
import com.homefinance.app.core.model.BudgetItem
import com.homefinance.app.core.model.CategoryItem
import com.homefinance.app.core.model.CategoryType
import com.homefinance.app.core.model.ExpenseItem
import com.homefinance.app.core.model.FinanceSnapshot
import com.homefinance.app.core.model.RevenueItem
import com.homefinance.app.data.local.HomeFinanceDatabase
import com.homefinance.app.data.local.entity.CategoriaEntity
import com.homefinance.app.data.local.entity.DespesaEntity
import com.homefinance.app.data.local.entity.OrcamentoEntity
import com.homefinance.app.data.local.entity.ReceitaEntity
import java.util.Calendar

class RoomFinanceRepository(
    private val database: HomeFinanceDatabase
) : FinanceRepository {
    private val budgetDao = database.orcamentoDao()
    private val categoryDao = database.categoriaDao()
    private val receitaDao = database.receitaDao()
    private val despesaDao = database.despesaDao()

    override suspend fun loadSnapshot(userId: Long, selectedBudgetId: Long?): FinanceSnapshot {
        val budgets = budgetDao.listByUser(userId).map {
            BudgetItem(id = it.id, year = it.year, isActive = it.isActive)
        }
        val categoriesRevenue = categoryDao.listByType(userId, CategoryType.RECEITA.name).map {
            CategoryItem(id = it.id, name = it.name, type = CategoryType.RECEITA)
        }
        val categoriesExpense = categoryDao.listByType(userId, CategoryType.DESPESA.name).map {
            CategoryItem(id = it.id, name = it.name, type = CategoryType.DESPESA)
        }
        val revenues = receitaDao.listByUser(userId, selectedBudgetId).map {
            RevenueItem(
                id = it.id,
                budgetId = it.orcamento_id,
                description = it.descricao,
                amountCents = it.valor_centavos,
                status = it.status,
                categoryName = it.categoria_nome
            )
        }
        val expenses = despesaDao.listByUser(userId, selectedBudgetId).map {
            ExpenseItem(
                id = it.id,
                budgetId = it.orcamento_id,
                description = it.descricao,
                amountCents = it.valor_centavos,
                status = it.status,
                categoryName = it.categoria_nome
            )
        }
        return FinanceSnapshot(
            budgets = budgets,
            categoriesRevenue = categoriesRevenue,
            categoriesExpense = categoriesExpense,
            revenues = revenues,
            expenses = expenses
        )
    }

    override suspend fun createBudget(userId: Long, year: Int): Result<Unit> {
        return runCatching {
            val existing = budgetDao.findByYear(userId, year)
            if (existing != null) {
                throw IllegalArgumentException("Ja existe um orcamento para $year.")
            }
            budgetDao.insert(
                OrcamentoEntity(
                    userId = userId,
                    year = year,
                    createdAt = System.currentTimeMillis().toString()
                )
            )
        }.map { Unit }
    }

    override suspend fun createCategory(userId: Long, name: String, type: CategoryType): Result<Unit> {
        return runCatching {
            val normalizedName = name.trim()
            val existing = categoryDao.findByNameAndType(userId, normalizedName, type.name)
            if (existing != null) {
                throw IllegalArgumentException("Ja existe categoria '${existing.name}' para ${type.name.lowercase()}.")
            }
            categoryDao.insert(
                CategoriaEntity(
                    userId = userId,
                    name = normalizedName,
                    type = type.name
                )
            )
        }.map { Unit }
    }

    override suspend fun createRevenue(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long
    ): Result<Unit> {
        return runCatching {
            receitaDao.insert(
                ReceitaEntity(
                    userId = userId,
                    budgetId = budgetId,
                    categoryId = categoryId,
                    description = description.trim(),
                    amountCents = amountCents,
                    status = "Pendente",
                    createdAt = System.currentTimeMillis().toString()
                )
            )
        }.map { Unit }
    }

    override suspend fun createExpense(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long
    ): Result<Unit> {
        return runCatching {
            despesaDao.insert(
                DespesaEntity(
                    userId = userId,
                    budgetId = budgetId,
                    categoryId = categoryId,
                    description = description.trim(),
                    amountCents = amountCents,
                    status = "Pendente",
                    createdAt = System.currentTimeMillis().toString()
                )
            )
        }.map { Unit }
    }

    override suspend fun toggleRevenueStatus(userId: Long, revenueId: Long): Result<Unit> {
        return runCatching {
            val current = receitaDao.findById(userId, revenueId)
                ?: throw IllegalStateException("Receita nao encontrada.")
            val nextStatus = if (current.status == "Recebido") "Pendente" else "Recebido"
            receitaDao.update(current.copy(status = nextStatus))
        }.map { Unit }
    }

    override suspend fun toggleExpenseStatus(userId: Long, expenseId: Long): Result<Unit> {
        return runCatching {
            val current = despesaDao.findById(userId, expenseId)
                ?: throw IllegalStateException("Despesa nao encontrada.")
            val nextStatus = if (current.status == "Pago") "Pendente" else "Pago"
            despesaDao.update(current.copy(status = nextStatus))
        }.map { Unit }
    }

    override suspend fun deleteRevenue(userId: Long, revenueId: Long): Result<Unit> {
        return runCatching {
            receitaDao.deleteById(userId, revenueId)
        }.map { Unit }
    }

    override suspend fun deleteExpense(userId: Long, expenseId: Long): Result<Unit> {
        return runCatching {
            despesaDao.deleteById(userId, expenseId)
        }.map { Unit }
    }

    suspend fun seedInitialData(userId: Long) {
        database.withTransaction {
            val currentBudgets = budgetDao.listByUser(userId)
            if (currentBudgets.isEmpty()) {
                budgetDao.insert(
                    OrcamentoEntity(
                        userId = userId,
                        year = Calendar.getInstance().get(Calendar.YEAR),
                        createdAt = System.currentTimeMillis().toString()
                    )
                )
            }

            val receitaCategories = categoryDao.listByType(userId, CategoryType.RECEITA.name)
            if (receitaCategories.none { it.name.equals("Salario", ignoreCase = true) }) {
                categoryDao.insert(
                    CategoriaEntity(
                        userId = userId,
                        name = "Salario",
                        type = CategoryType.RECEITA.name
                    )
                )
            }

            val despesaCategories = categoryDao.listByType(userId, CategoryType.DESPESA.name)
            if (despesaCategories.none { it.name.equals("Moradia", ignoreCase = true) }) {
                categoryDao.insert(
                    CategoriaEntity(
                        userId = userId,
                        name = "Moradia",
                        type = CategoryType.DESPESA.name
                    )
                )
            }
        }
    }
}
