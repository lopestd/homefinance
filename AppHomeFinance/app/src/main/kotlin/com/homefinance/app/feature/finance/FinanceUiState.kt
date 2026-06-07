package com.homefinance.app.feature.finance

import com.homefinance.app.core.model.BudgetItem
import com.homefinance.app.core.model.CategoryItem
import com.homefinance.app.core.model.ExpenseItem
import com.homefinance.app.core.model.RevenueItem

data class FinanceUiState(
    val isLoading: Boolean = true,
    val selectedBudgetId: Long? = null,
    val budgets: List<BudgetItem> = emptyList(),
    val categoriesRevenue: List<CategoryItem> = emptyList(),
    val categoriesExpense: List<CategoryItem> = emptyList(),
    val revenues: List<RevenueItem> = emptyList(),
    val expenses: List<ExpenseItem> = emptyList(),
    val message: String? = null
)

