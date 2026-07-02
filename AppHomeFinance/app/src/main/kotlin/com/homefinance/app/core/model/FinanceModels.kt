package com.homefinance.app.core.model

enum class CategoryType {
    RECEITA,
    DESPESA
}

enum class RecurrenceType {
    EVENTUAL,
    FIXO,
    PARCELADO
}

enum class CardMovement {
    DEBITO,
    CREDITO
}

data class BudgetItem(
    val id: Long,
    val year: Int,
    val isActive: Boolean,
    val months: List<Int> = (1..12).toList(),
    val initialBalanceCents: Long = 0L
)

data class CategoryItem(
    val id: Long,
    val name: String,
    val type: CategoryType
)

data class RevenueItem(
    val id: Long,
    val budgetId: Long,
    val categoryId: Long?,
    val description: String,
    val complement: String?,
    val amountCents: Long,
    val month: Int,
    val dateIso: String?,
    val status: String,
    val recurrenceType: RecurrenceType,
    val installment: Int?,
    val totalInstallments: Int?,
    val categoryName: String?
)

data class ExpenseItem(
    val id: Long,
    val budgetId: Long,
    val categoryId: Long?,
    val description: String,
    val complement: String?,
    val amountCents: Long,
    val month: Int,
    val dateIso: String?,
    val status: String,
    val recurrenceType: RecurrenceType,
    val installment: Int?,
    val totalInstallments: Int?,
    val isCardInvoice: Boolean,
    val categoryName: String?
)

data class PredefinedExpenseItem(
    val id: Long,
    val categoryId: Long,
    val description: String
)

data class PredefinedRevenueItem(
    val id: Long,
    val description: String,
    val isRecurring: Boolean
)

data class CardItem(
    val id: Long,
    val name: String,
    val defaultLimitCents: Long,
    val isActive: Boolean
)

data class CardChargeItem(
    val id: Long,
    val budgetId: Long,
    val cardId: Long,
    val cardName: String,
    val categoryId: Long?,
    val categoryName: String?,
    val description: String,
    val complement: String?,
    val amountCents: Long,
    val month: Int,
    val dateIso: String,
    val recurrenceType: RecurrenceType,
    val installment: Int?,
    val totalInstallments: Int?,
    val movement: CardMovement
)

data class CardMonthlySummary(
    val cardId: Long,
    val cardName: String,
    val budgetId: Long,
    val month: Int,
    val limitCents: Long,
    val debitsCents: Long,
    val creditsCents: Long,
    val isClosed: Boolean
) {
    val invoiceCents: Long = (debitsCents - creditsCents).coerceAtLeast(0L)
    val availableCents: Long = (limitCents - invoiceCents).coerceAtLeast(0L)
}

data class FinanceSnapshot(
    val budgets: List<BudgetItem>,
    val categoriesRevenue: List<CategoryItem>,
    val categoriesExpense: List<CategoryItem>,
    val revenues: List<RevenueItem>,
    val expenses: List<ExpenseItem>,
    val predefinedExpenses: List<PredefinedExpenseItem>,
    val predefinedRevenues: List<PredefinedRevenueItem>,
    val cards: List<CardItem>,
    val cardCharges: List<CardChargeItem>,
    val cardSummaries: List<CardMonthlySummary>
)
