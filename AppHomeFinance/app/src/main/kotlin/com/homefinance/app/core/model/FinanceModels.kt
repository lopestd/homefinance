package com.homefinance.app.core.model

enum class CategoryType {
    RECEITA,
    DESPESA
}

data class BudgetItem(
    val id: Long,
    val year: Int,
    val isActive: Boolean
)

data class CategoryItem(
    val id: Long,
    val name: String,
    val type: CategoryType
)

data class RevenueItem(
    val id: Long,
    val budgetId: Long,
    val description: String,
    val amountCents: Long,
    val status: String,
    val categoryName: String?
)

data class ExpenseItem(
    val id: Long,
    val budgetId: Long,
    val description: String,
    val amountCents: Long,
    val status: String,
    val categoryName: String?
)

data class FinanceSnapshot(
    val budgets: List<BudgetItem>,
    val categoriesRevenue: List<CategoryItem>,
    val categoriesExpense: List<CategoryItem>,
    val revenues: List<RevenueItem>,
    val expenses: List<ExpenseItem>
)

