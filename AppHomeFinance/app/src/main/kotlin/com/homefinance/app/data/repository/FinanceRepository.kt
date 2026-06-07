package com.homefinance.app.data.repository

import com.homefinance.app.core.model.CategoryType
import com.homefinance.app.core.model.FinanceSnapshot

interface FinanceRepository {
    suspend fun loadSnapshot(userId: Long, selectedBudgetId: Long?): FinanceSnapshot
    suspend fun createBudget(userId: Long, year: Int): Result<Unit>
    suspend fun createCategory(userId: Long, name: String, type: CategoryType): Result<Unit>
    suspend fun createRevenue(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long
    ): Result<Unit>

    suspend fun createExpense(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long
    ): Result<Unit>

    suspend fun toggleRevenueStatus(userId: Long, revenueId: Long): Result<Unit>
    suspend fun toggleExpenseStatus(userId: Long, expenseId: Long): Result<Unit>
    suspend fun deleteRevenue(userId: Long, revenueId: Long): Result<Unit>
    suspend fun deleteExpense(userId: Long, expenseId: Long): Result<Unit>
}

