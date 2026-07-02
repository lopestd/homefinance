package com.homefinance.app.data.repository

import com.homefinance.app.core.model.CategoryType
import com.homefinance.app.core.model.RecurrenceType
import com.homefinance.app.core.model.CardMovement
import com.homefinance.app.core.model.FinanceSnapshot

interface FinanceRepository {
    suspend fun loadSnapshot(userId: Long, selectedBudgetId: Long?): FinanceSnapshot
    suspend fun createBudget(userId: Long, year: Int): Result<Unit>
    suspend fun updateBudget(userId: Long, budgetId: Long, year: Int): Result<Unit>
    suspend fun createCategory(userId: Long, name: String, type: CategoryType): Result<Unit>
    suspend fun updateCategory(userId: Long, categoryId: Long, name: String, type: CategoryType): Result<Unit>
    suspend fun updateInitialBalance(userId: Long, budgetId: Long, amountCents: Long): Result<Unit>
    suspend fun createPredefinedExpense(
        userId: Long,
        categoryId: Long,
        description: String
    ): Result<Unit>

    suspend fun updatePredefinedExpense(
        userId: Long,
        predefinedExpenseId: Long,
        categoryId: Long,
        description: String
    ): Result<Unit>

    suspend fun createPredefinedRevenue(
        userId: Long,
        description: String,
        isRecurring: Boolean
    ): Result<Unit>

    suspend fun updatePredefinedRevenue(
        userId: Long,
        predefinedRevenueId: Long,
        description: String,
        isRecurring: Boolean
    ): Result<Unit>

    suspend fun createCard(userId: Long, name: String, defaultLimitCents: Long): Result<Unit>
    suspend fun updateCard(userId: Long, cardId: Long, name: String, defaultLimitCents: Long): Result<Unit>
    suspend fun setCardLimit(
        userId: Long,
        cardId: Long,
        budgetId: Long,
        month: Int,
        limitCents: Long
    ): Result<Unit>

    suspend fun createRevenue(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        complement: String? = null,
        month: Int = 1,
        dateIso: String? = null,
        status: String = "Pendente",
        recurrenceType: RecurrenceType = RecurrenceType.EVENTUAL,
        installments: Int = 1,
        recurrenceMonths: List<Int> = emptyList()
    ): Result<Unit>

    suspend fun createExpense(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        complement: String? = null,
        month: Int = 1,
        dateIso: String? = null,
        status: String = "Pendente",
        recurrenceType: RecurrenceType = RecurrenceType.EVENTUAL,
        installments: Int = 1,
        recurrenceMonths: List<Int> = emptyList()
    ): Result<Unit>

    suspend fun createCardCharge(
        userId: Long,
        budgetId: Long,
        cardId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        movement: CardMovement,
        complement: String? = null,
        month: Int = 1,
        dateIso: String,
        recurrenceType: RecurrenceType = RecurrenceType.EVENTUAL,
        installments: Int = 1,
        recurrenceMonths: List<Int> = emptyList()
    ): Result<Unit>

    suspend fun updateRevenue(
        userId: Long,
        revenueId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        complement: String?,
        dateIso: String?,
        status: String
    ): Result<Unit>

    suspend fun updateExpense(
        userId: Long,
        expenseId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        complement: String?,
        dateIso: String?,
        status: String
    ): Result<Unit>

    suspend fun updateCardCharge(
        userId: Long,
        chargeId: Long,
        cardId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        movement: CardMovement,
        complement: String?,
        dateIso: String
    ): Result<Unit>

    suspend fun closeCardInvoice(userId: Long, cardId: Long, budgetId: Long, month: Int): Result<Unit>
    suspend fun reopenCardInvoice(userId: Long, cardId: Long, budgetId: Long, month: Int): Result<Unit>
    suspend fun deleteCardCharge(userId: Long, chargeId: Long): Result<Unit>
    suspend fun toggleRevenueStatus(userId: Long, revenueId: Long): Result<Unit>
    suspend fun toggleExpenseStatus(userId: Long, expenseId: Long): Result<Unit>
    suspend fun deleteRevenue(userId: Long, revenueId: Long): Result<Unit>
    suspend fun deleteExpense(userId: Long, expenseId: Long): Result<Unit>
}
