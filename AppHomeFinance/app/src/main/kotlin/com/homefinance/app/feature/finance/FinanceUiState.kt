package com.homefinance.app.feature.finance

import com.homefinance.app.core.model.BudgetItem
import com.homefinance.app.core.model.CardChargeItem
import com.homefinance.app.core.model.CardItem
import com.homefinance.app.core.model.CardMonthlySummary
import com.homefinance.app.core.model.CategoryItem
import com.homefinance.app.core.model.ExpenseItem
import com.homefinance.app.core.model.PredefinedExpenseItem
import com.homefinance.app.core.model.PredefinedRevenueItem
import com.homefinance.app.core.model.RevenueItem

data class FinanceUiState(
    val isLoading: Boolean = true,
    val selectedBudgetId: Long? = null,
    val budgets: List<BudgetItem> = emptyList(),
    val categoriesRevenue: List<CategoryItem> = emptyList(),
    val categoriesExpense: List<CategoryItem> = emptyList(),
    val revenues: List<RevenueItem> = emptyList(),
    val expenses: List<ExpenseItem> = emptyList(),
    val predefinedExpenses: List<PredefinedExpenseItem> = emptyList(),
    val predefinedRevenues: List<PredefinedRevenueItem> = emptyList(),
    val cards: List<CardItem> = emptyList(),
    val cardCharges: List<CardChargeItem> = emptyList(),
    val cardSummaries: List<CardMonthlySummary> = emptyList(),
    val message: String? = null
)
