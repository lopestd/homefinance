package com.homefinance.app.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.homefinance.app.core.model.BudgetItem
import com.homefinance.app.core.model.CardChargeItem
import com.homefinance.app.core.model.CardItem
import com.homefinance.app.core.model.CardMonthlySummary
import com.homefinance.app.core.model.CardMovement
import com.homefinance.app.core.model.CategoryItem
import com.homefinance.app.core.model.CategoryType
import com.homefinance.app.core.model.ExpenseItem
import com.homefinance.app.core.model.PredefinedExpenseItem
import com.homefinance.app.core.model.PredefinedRevenueItem
import com.homefinance.app.core.model.RecurrenceType
import com.homefinance.app.core.model.RevenueItem
import com.homefinance.app.core.ui.theme.HfAmber
import com.homefinance.app.core.ui.theme.HfBlue
import com.homefinance.app.core.ui.theme.HfBlueSoft
import com.homefinance.app.core.ui.theme.HfBorder
import com.homefinance.app.core.ui.theme.HfGreen
import com.homefinance.app.core.ui.theme.HfMuted
import com.homefinance.app.core.ui.theme.HfNavy
import com.homefinance.app.core.ui.theme.HfNavyDeep
import com.homefinance.app.core.ui.theme.HfPage
import com.homefinance.app.core.ui.theme.HfRed
import com.homefinance.app.core.ui.theme.HfSurface
import com.homefinance.app.core.ui.theme.HfSurfaceMuted
import com.homefinance.app.core.ui.theme.HfTeal
import com.homefinance.app.core.ui.theme.HfText
import com.homefinance.app.feature.finance.FinanceUiState
import java.text.NumberFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import kotlin.math.roundToInt

private enum class MainTab(val label: String, val bottomLabel: String = label) {
    Dashboard("Painel"),
    Receitas("Receitas"),
    Despesas("Despesas"),
    Cartoes("Cartões"),
    Mais("Mais")
}

private enum class MoreSection {
    Menu,
    Relatorios,
    Configuracoes
}

private enum class EntryFilter(val label: String) {
    All("Todas"),
    Open("Pendentes"),
    Closed("Concluídas")
}

private data class FinanceTotals(
    val saldoInicial: Long,
    val totalReceitas: Long,
    val totalRecebido: Long,
    val totalDespesas: Long,
    val totalPago: Long
) {
    val saldoAtual: Long = saldoInicial + totalRecebido - totalPago
    val saldoPrevisto: Long = saldoInicial + totalReceitas - totalDespesas
    val pendenteReceita: Long = (totalReceitas - totalRecebido).coerceAtLeast(0L)
    val pendenteDespesa: Long = (totalDespesas - totalPago).coerceAtLeast(0L)
}

private data class TimelineItem(
    val id: String,
    val title: String,
    val category: String,
    val amountCents: Long,
    val status: String,
    val isIncome: Boolean
)

private enum class DeleteTargetType {
    Revenue,
    Expense,
    CardCharge
}

private data class DeleteTarget(
    val type: DeleteTargetType,
    val id: Long
)

private data class PredefinedDescriptionOption(
    val description: String,
    val categoryId: Long? = null
)

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun HomeScreen(
    accountName: String,
    uiState: FinanceUiState,
    onLogout: () -> Unit,
    onSelectBudget: (Long?) -> Unit,
    onCreateBudget: (String) -> Unit,
    onUpdateBudget: (Long, String) -> Unit,
    onCreateCategory: (String, CategoryType) -> Unit,
    onUpdateCategory: (Long, String, CategoryType) -> Unit,
    onCreateRevenue: (
        description: String,
        amount: String,
        categoryId: Long?,
        complement: String?,
        month: Int,
        dateIso: String?,
        status: String,
        recurrenceType: RecurrenceType,
        installments: String,
        recurrenceMonths: List<Int>
    ) -> Unit,
    onCreateExpense: (
        description: String,
        amount: String,
        categoryId: Long?,
        complement: String?,
        month: Int,
        dateIso: String?,
        status: String,
        recurrenceType: RecurrenceType,
        installments: String,
        recurrenceMonths: List<Int>
    ) -> Unit,
    onUpdateInitialBalance: (String) -> Unit,
    onCreatePredefinedExpense: (String, Long?) -> Unit,
    onUpdatePredefinedExpense: (Long, String, Long?) -> Unit,
    onCreatePredefinedRevenue: (String, Boolean) -> Unit,
    onUpdatePredefinedRevenue: (Long, String, Boolean) -> Unit,
    onCreateCard: (String, String) -> Unit,
    onUpdateCard: (Long, String, String) -> Unit,
    onSetCardLimit: (Long?, Int, String) -> Unit,
    onCreateCardCharge: (
        cardId: Long?,
        categoryId: Long?,
        description: String,
        amount: String,
        movement: CardMovement,
        complement: String?,
        month: Int,
        dateIso: String,
        recurrenceType: RecurrenceType,
        installments: String,
        recurrenceMonths: List<Int>
    ) -> Unit,
    onUpdateRevenue: (
        revenueId: Long,
        description: String,
        amount: String,
        categoryId: Long?,
        complement: String?,
        dateIso: String?,
        status: String
    ) -> Unit,
    onUpdateExpense: (
        expenseId: Long,
        description: String,
        amount: String,
        categoryId: Long?,
        complement: String?,
        dateIso: String?,
        status: String
    ) -> Unit,
    onUpdateCardCharge: (
        chargeId: Long,
        cardId: Long?,
        categoryId: Long?,
        description: String,
        amount: String,
        movement: CardMovement,
        complement: String?,
        dateIso: String
    ) -> Unit,
    onCloseCardInvoice: (Long, Long, Int) -> Unit,
    onReopenCardInvoice: (Long, Long, Int) -> Unit,
    onDeleteCardCharge: (Long) -> Unit,
    onToggleRevenueStatus: (Long) -> Unit,
    onToggleExpenseStatus: (Long) -> Unit,
    onDeleteRevenue: (Long) -> Unit,
    onDeleteExpense: (Long) -> Unit,
    onClearMessage: () -> Unit
) {
    var selectedTabName by rememberSaveable { mutableStateOf(MainTab.Dashboard.name) }
    val selectedTab = remember(selectedTabName) {
        MainTab.entries.firstOrNull { it.name == selectedTabName } ?: MainTab.Dashboard
    }
    var moreSectionName by rememberSaveable { mutableStateOf(MoreSection.Menu.name) }
    val moreSection = remember(moreSectionName) {
        MoreSection.entries.firstOrNull { it.name == moreSectionName } ?: MoreSection.Menu
    }
    val budgetMonths = selectedBudgetMonths(uiState)
    var selectedMonth by rememberSaveable { mutableStateOf(currentMonth(budgetMonths)) }
    var cardsSelectedMonth by rememberSaveable { mutableStateOf(selectedMonth) }
    var cardsOpenVersion by rememberSaveable { mutableStateOf(0) }

    var revenueSheetOpen by rememberSaveable { mutableStateOf(false) }
    var expenseSheetOpen by rememberSaveable { mutableStateOf(false) }
    var budgetSheetOpen by rememberSaveable { mutableStateOf(false) }
    var categorySheetOpen by rememberSaveable { mutableStateOf(false) }
    var initialBalanceSheetOpen by rememberSaveable { mutableStateOf(false) }
    var predefinedExpenseSheetOpen by rememberSaveable { mutableStateOf(false) }
    var predefinedRevenueSheetOpen by rememberSaveable { mutableStateOf(false) }
    var cardSheetOpen by rememberSaveable { mutableStateOf(false) }
    var cardLimitSheetOpen by rememberSaveable { mutableStateOf(false) }
    var cardChargeSheetOpen by rememberSaveable { mutableStateOf(false) }
    var editingRevenue by remember { mutableStateOf<RevenueItem?>(null) }
    var editingExpense by remember { mutableStateOf<ExpenseItem?>(null) }
    var editingCardCharge by remember { mutableStateOf<CardChargeItem?>(null) }
    var editingBudget by remember { mutableStateOf<BudgetItem?>(null) }
    var editingCategory by remember { mutableStateOf<CategoryItem?>(null) }
    var editingPredefinedExpense by remember { mutableStateOf<PredefinedExpenseItem?>(null) }
    var editingPredefinedRevenue by remember { mutableStateOf<PredefinedRevenueItem?>(null) }
    var editingCard by remember { mutableStateOf<CardItem?>(null) }
    var pendingDelete by remember { mutableStateOf<DeleteTarget?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(uiState.selectedBudgetId, budgetMonths) {
        if (selectedMonth !in budgetMonths) {
            selectedMonth = currentMonth(budgetMonths)
        }
        if (cardsSelectedMonth !in budgetMonths) {
            cardsSelectedMonth = selectedMonth
        }
    }

    val filteredUiState = remember(uiState, selectedMonth) {
        uiState.copy(
            revenues = uiState.revenues.filter { it.month == selectedMonth },
            expenses = uiState.expenses.filter { it.month == selectedMonth },
            cardCharges = uiState.cardCharges.filter { it.month == selectedMonth },
            cardSummaries = uiState.cardSummaries.filter { it.month == selectedMonth }
        )
    }
    val totals = remember(filteredUiState.revenues, filteredUiState.expenses, uiState.budgets, uiState.selectedBudgetId) {
        val selectedBudget = uiState.budgets.firstOrNull { it.id == uiState.selectedBudgetId }
        calculateTotals(
            revenues = filteredUiState.revenues,
            expenses = filteredUiState.expenses,
            initialBalanceCents = selectedBudget?.initialBalanceCents ?: 0L
        )
    }

    LaunchedEffect(uiState.message) {
        val message = uiState.message
        if (!message.isNullOrBlank()) {
            snackbarHostState.showSnackbar(message)
            onClearMessage()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(HfNavyDeep, HfNavy, HfPage),
                    startY = 0f,
                    endY = 780f
                )
            )
    ) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                HomeHeader(
                    accountName = accountName,
                    selectedTab = selectedTab,
                    moreSection = moreSection,
                    onBackToMore = { moreSectionName = MoreSection.Menu.name },
                    onLogout = onLogout
                )
            },
            bottomBar = {
                HomeBottomBar(
                    selectedTab = selectedTab,
                    onSelectTab = {
                        if (it == MainTab.Cartoes && selectedTabName != it.name) {
                            cardsOpenVersion += 1
                            cardsSelectedMonth = selectedMonth
                        }
                        selectedTabName = it.name
                        if (it != MainTab.Mais) {
                            moreSectionName = MoreSection.Menu.name
                        }
                    }
                )
            },
            floatingActionButton = {
                when {
                    selectedTab == MainTab.Receitas -> AddFab(onClick = { revenueSheetOpen = true })
                    selectedTab == MainTab.Despesas -> AddFab(onClick = { expenseSheetOpen = true })
                    selectedTab == MainTab.Cartoes -> AddFab(onClick = { cardChargeSheetOpen = true })
                }
            },
            snackbarHost = { SnackbarHost(snackbarHostState) }
        ) { padding ->
            when (selectedTab) {
                MainTab.Dashboard -> DashboardScreen(
                    padding = padding,
                    uiState = filteredUiState,
                    months = budgetMonths,
                    selectedMonth = selectedMonth,
                    totals = totals,
                    onSelectBudget = onSelectBudget,
                    onSelectMonth = { selectedMonth = it }
                )
                MainTab.Receitas -> RevenuesScreen(
                    padding = padding,
                    uiState = filteredUiState,
                    totals = totals,
                    onToggleRevenueStatus = onToggleRevenueStatus,
                    onEditRevenue = { editingRevenue = it },
                    onDeleteRevenue = { pendingDelete = DeleteTarget(DeleteTargetType.Revenue, it) }
                )
                MainTab.Despesas -> ExpensesScreen(
                    padding = padding,
                    uiState = filteredUiState,
                    totals = totals,
                    onToggleExpenseStatus = onToggleExpenseStatus,
                    onEditExpense = { editingExpense = it },
                    onDeleteExpense = { pendingDelete = DeleteTarget(DeleteTargetType.Expense, it) }
                )
                MainTab.Cartoes -> CardsScreen(
                    padding = padding,
                    uiState = uiState,
                    months = budgetMonths,
                    selectedMonth = cardsSelectedMonth,
                    openVersion = cardsOpenVersion,
                    onSelectMonth = { cardsSelectedMonth = it },
                    onOpenLimitSheet = { cardLimitSheetOpen = true },
                    onCloseInvoice = onCloseCardInvoice,
                    onReopenInvoice = onReopenCardInvoice,
                    onEditCardCharge = { editingCardCharge = it },
                    onDeleteCardCharge = { pendingDelete = DeleteTarget(DeleteTargetType.CardCharge, it) }
                )
                MainTab.Mais -> MoreScreen(
                    padding = padding,
                    section = moreSection,
                    uiState = filteredUiState,
                    totals = totals,
                    onOpenRelatorios = { moreSectionName = MoreSection.Relatorios.name },
                    onOpenConfiguracoes = { moreSectionName = MoreSection.Configuracoes.name },
                    onOpenBudgetSheet = { budgetSheetOpen = true },
                    onEditBudget = { editingBudget = it },
                    onOpenCategorySheet = { categorySheetOpen = true },
                    onEditCategory = { editingCategory = it },
                    onOpenInitialBalanceSheet = { initialBalanceSheetOpen = true },
                    onOpenPredefinedExpenseSheet = { predefinedExpenseSheetOpen = true },
                    onEditPredefinedExpense = { editingPredefinedExpense = it },
                    onOpenPredefinedRevenueSheet = { predefinedRevenueSheetOpen = true },
                    onEditPredefinedRevenue = { editingPredefinedRevenue = it },
                    onOpenCardSheet = { cardSheetOpen = true },
                    onEditCard = { editingCard = it },
                    onOpenCardLimitSheet = { cardLimitSheetOpen = true }
                )
            }
        }
    }

    if (revenueSheetOpen) {
        EntrySheet(
            title = "Nova receita (mês: ${monthName(selectedMonth)})",
            categories = uiState.categoriesRevenue,
            predefinedDescriptions = uiState.predefinedRevenues.map { PredefinedDescriptionOption(it.description) },
            saveLabel = "Salvar receita",
            closedStatusLabel = "Recebido",
            months = budgetMonths,
            initialMonth = selectedMonth,
            onDismiss = { revenueSheetOpen = false },
            onSave = { description, amount, categoryId, complement, month, dateIso, status, recurrence, installments, recurrenceMonths ->
                onCreateRevenue(description, amount, categoryId, complement, month, dateIso, status, recurrence, installments, recurrenceMonths)
                revenueSheetOpen = false
            }
        )
    }

    editingRevenue?.let { revenue ->
        EntrySheet(
            title = "Editar receita (mês: ${monthName(revenue.month)})",
            categories = uiState.categoriesRevenue,
            predefinedDescriptions = uiState.predefinedRevenues.map { PredefinedDescriptionOption(it.description) },
            saveLabel = "Salvar alterações",
            closedStatusLabel = "Recebido",
            months = budgetMonths,
            initialMonth = revenue.month,
            initialDescription = revenue.description,
            initialComplement = revenue.complement.orEmpty(),
            initialAmount = formatAmountForInput(revenue.amountCents),
            initialCategoryId = revenue.categoryId,
            initialDateIso = revenue.dateIso.orEmpty(),
            initialStatus = revenue.status,
            showRecurrence = false,
            onDismiss = { editingRevenue = null },
            onSave = { description, amount, categoryId, complement, _, dateIso, status, _, _, _ ->
                onUpdateRevenue(revenue.id, description, amount, categoryId, complement, dateIso, status)
                editingRevenue = null
            }
        )
    }

    if (expenseSheetOpen) {
        EntrySheet(
            title = "Nova despesa (mês: ${monthName(selectedMonth)})",
            categories = uiState.categoriesExpense,
            predefinedDescriptions = uiState.predefinedExpenses.map {
                PredefinedDescriptionOption(it.description, it.categoryId)
            },
            saveLabel = "Salvar despesa",
            closedStatusLabel = "Pago",
            months = budgetMonths,
            initialMonth = selectedMonth,
            onDismiss = { expenseSheetOpen = false },
            onSave = { description, amount, categoryId, complement, month, dateIso, status, recurrence, installments, recurrenceMonths ->
                onCreateExpense(description, amount, categoryId, complement, month, dateIso, status, recurrence, installments, recurrenceMonths)
                expenseSheetOpen = false
            }
        )
    }

    editingExpense?.let { expense ->
        EntrySheet(
            title = "Editar despesa (mês: ${monthName(expense.month)})",
            categories = uiState.categoriesExpense,
            predefinedDescriptions = uiState.predefinedExpenses.map {
                PredefinedDescriptionOption(it.description, it.categoryId)
            },
            saveLabel = "Salvar alterações",
            closedStatusLabel = "Pago",
            months = budgetMonths,
            initialMonth = expense.month,
            initialDescription = expense.description,
            initialComplement = expense.complement.orEmpty(),
            initialAmount = formatAmountForInput(expense.amountCents),
            initialCategoryId = expense.categoryId,
            initialDateIso = expense.dateIso.orEmpty(),
            initialStatus = expense.status,
            showRecurrence = false,
            onDismiss = { editingExpense = null },
            onSave = { description, amount, categoryId, complement, _, dateIso, status, _, _, _ ->
                onUpdateExpense(expense.id, description, amount, categoryId, complement, dateIso, status)
                editingExpense = null
            }
        )
    }

    if (budgetSheetOpen) {
        BudgetSheet(
            onDismiss = { budgetSheetOpen = false },
            onSave = {
                onCreateBudget(it)
                budgetSheetOpen = false
            }
        )
    }

    editingBudget?.let { budget ->
        BudgetSheet(
            title = "Editar orçamento",
            saveLabel = "Salvar alterações",
            initialYear = budget.year.toString(),
            onDismiss = { editingBudget = null },
            onSave = {
                onUpdateBudget(budget.id, it)
                editingBudget = null
            }
        )
    }

    if (categorySheetOpen) {
        CategorySheet(
            onDismiss = { categorySheetOpen = false },
            onSave = { name, type ->
                onCreateCategory(name, type)
                categorySheetOpen = false
            }
        )
    }

    editingCategory?.let { category ->
        CategorySheet(
            title = "Editar categoria",
            saveLabel = "Salvar alterações",
            initialName = category.name,
            initialType = category.type,
            onDismiss = { editingCategory = null },
            onSave = { name, type ->
                onUpdateCategory(category.id, name, type)
                editingCategory = null
            }
        )
    }

    if (initialBalanceSheetOpen) {
        AmountSheet(
            title = "Saldo inicial",
            label = "Valor",
            saveLabel = "Atualizar saldo",
            onDismiss = { initialBalanceSheetOpen = false },
            onSave = {
                onUpdateInitialBalance(it)
                initialBalanceSheetOpen = false
            }
        )
    }

    if (predefinedExpenseSheetOpen) {
        PredefinedExpenseSheet(
            categories = uiState.categoriesExpense,
            onDismiss = { predefinedExpenseSheetOpen = false },
            onSave = { description, categoryId ->
                onCreatePredefinedExpense(description, categoryId)
                predefinedExpenseSheetOpen = false
            }
        )
    }

    editingPredefinedExpense?.let { item ->
        PredefinedExpenseSheet(
            title = "Editar gasto pré-definido",
            saveLabel = "Salvar alterações",
            categories = uiState.categoriesExpense,
            initialDescription = item.description,
            initialCategoryId = item.categoryId,
            onDismiss = { editingPredefinedExpense = null },
            onSave = { description, categoryId ->
                onUpdatePredefinedExpense(item.id, description, categoryId)
                editingPredefinedExpense = null
            }
        )
    }

    if (predefinedRevenueSheetOpen) {
        PredefinedRevenueSheet(
            onDismiss = { predefinedRevenueSheetOpen = false },
            onSave = { description, recurring ->
                onCreatePredefinedRevenue(description, recurring)
                predefinedRevenueSheetOpen = false
            }
        )
    }

    editingPredefinedRevenue?.let { item ->
        PredefinedRevenueSheet(
            title = "Editar receita pré-definida",
            saveLabel = "Salvar alterações",
            initialDescription = item.description,
            initialRecurring = item.isRecurring,
            onDismiss = { editingPredefinedRevenue = null },
            onSave = { description, recurring ->
                onUpdatePredefinedRevenue(item.id, description, recurring)
                editingPredefinedRevenue = null
            }
        )
    }

    if (cardSheetOpen) {
        CardSheet(
            onDismiss = { cardSheetOpen = false },
            onSave = { name, limit ->
                onCreateCard(name, limit)
                cardSheetOpen = false
            }
        )
    }

    editingCard?.let { card ->
        CardSheet(
            title = "Editar cartão",
            saveLabel = "Salvar alterações",
            initialName = card.name,
            initialLimit = formatAmountForInput(card.defaultLimitCents),
            onDismiss = { editingCard = null },
            onSave = { name, limit ->
                onUpdateCard(card.id, name, limit)
                editingCard = null
            }
        )
    }

    if (cardLimitSheetOpen) {
        CardLimitSheet(
            cards = uiState.cards,
            initialMonth = selectedMonth,
            onDismiss = { cardLimitSheetOpen = false },
            onSave = { cardId, month, limit ->
                onSetCardLimit(cardId, month, limit)
                cardLimitSheetOpen = false
            }
        )
    }

    if (cardChargeSheetOpen) {
        CardChargeSheet(
            title = "Novo lançamento no cartão (mês: ${monthName(cardsSelectedMonth)})",
            cards = uiState.cards,
            categories = uiState.categoriesExpense,
            predefinedDescriptions = uiState.predefinedExpenses.map {
                PredefinedDescriptionOption(it.description, it.categoryId)
            },
            months = budgetMonths,
            initialMonth = cardsSelectedMonth,
            onDismiss = { cardChargeSheetOpen = false },
            onSave = { cardId, categoryId, description, amount, movement, complement, month, dateIso, recurrence, installments, recurrenceMonths ->
                onCreateCardCharge(cardId, categoryId, description, amount, movement, complement, month, dateIso, recurrence, installments, recurrenceMonths)
                cardChargeSheetOpen = false
            }
        )
    }

    editingCardCharge?.let { charge ->
        CardChargeSheet(
            title = "Editar lançamento no cartão (mês: ${monthName(charge.month)})",
            cards = uiState.cards,
            categories = uiState.categoriesExpense,
            predefinedDescriptions = uiState.predefinedExpenses.map {
                PredefinedDescriptionOption(it.description, it.categoryId)
            },
            months = budgetMonths,
            initialMonth = charge.month,
            initialCardId = charge.cardId,
            initialCategoryId = charge.categoryId,
            initialDescription = charge.description,
            initialComplement = charge.complement.orEmpty(),
            initialAmount = formatAmountForInput(charge.amountCents),
            initialMovement = charge.movement,
            initialDateIso = charge.dateIso,
            showRecurrence = false,
            saveLabel = "Salvar alterações",
            onDismiss = { editingCardCharge = null },
            onSave = { cardId, categoryId, description, amount, movement, complement, _, dateIso, _, _, _ ->
                onUpdateCardCharge(charge.id, cardId, categoryId, description, amount, movement, complement, dateIso)
                editingCardCharge = null
            }
        )
    }

    pendingDelete?.let { target ->
        AlertDialog(
            onDismissRequest = { pendingDelete = null },
            title = { Text("Excluir lançamento?") },
            text = { Text("Confirme para excluir ou cancele a ação.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        when (target.type) {
                            DeleteTargetType.Revenue -> onDeleteRevenue(target.id)
                            DeleteTargetType.Expense -> onDeleteExpense(target.id)
                            DeleteTargetType.CardCharge -> onDeleteCardCharge(target.id)
                        }
                        pendingDelete = null
                    }
                ) {
                    Text("Confirmar")
                }
            },
            dismissButton = {
                TextButton(onClick = { pendingDelete = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun HomeHeader(
    accountName: String,
    selectedTab: MainTab,
    moreSection: MoreSection,
    onBackToMore: () -> Unit,
    onLogout: () -> Unit
) {
    Surface(color = Color.Transparent) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 62.dp)
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(HfNavyDeep, HfNavy, HfBlue)
                    )
                )
                .statusBarsPadding()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color.White.copy(alpha = 0.12f),
                    contentColor = Color.White
                ) {
                    Icon(
                        imageVector = if (selectedTab == MainTab.Mais) Icons.Filled.MoreVert else tabIcon(selectedTab),
                        contentDescription = null,
                        modifier = Modifier
                            .padding(8.dp)
                            .size(20.dp)
                    )
                }
                Column {
                    Text(
                        text = if (selectedTab == MainTab.Mais && moreSection != MoreSection.Menu) {
                            moreSectionLabel(moreSection)
                        } else {
                            selectedTab.label
                        },
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.AccountCircle,
                            contentDescription = null,
                            tint = Color.White.copy(alpha = 0.72f),
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = accountName,
                            color = Color.White.copy(alpha = 0.74f),
                            style = MaterialTheme.typography.bodySmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
            if (selectedTab == MainTab.Mais && moreSection != MoreSection.Menu) {
                TextButton(onClick = onBackToMore) {
                    Text("Voltar", color = Color.White)
                }
            }
            IconButton(onClick = onLogout) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                    contentDescription = "Sair",
                    tint = Color.White
                )
            }
        }
    }
}

@Composable
private fun HomeBottomBar(
    selectedTab: MainTab,
    onSelectTab: (MainTab) -> Unit
) {
    NavigationBar(
        containerColor = HfSurface,
        tonalElevation = 10.dp
    ) {
        MainTab.entries.forEach { tab ->
            NavigationBarItem(
                selected = selectedTab == tab,
                onClick = { onSelectTab(tab) },
                icon = {
                    Icon(
                        imageVector = tabIcon(tab),
                        contentDescription = tab.label
                    )
                },
                label = {
                    Text(
                        text = tab.bottomLabel,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            )
        }
    }
}

@Composable
private fun AddFab(onClick: () -> Unit) {
    FloatingActionButton(
        onClick = onClick,
        containerColor = HfBlue,
        contentColor = Color.White
    ) {
        Icon(Icons.Filled.Add, contentDescription = "Adicionar")
    }
}

@Composable
private fun DashboardScreen(
    padding: PaddingValues,
    uiState: FinanceUiState,
    months: List<Int>,
    selectedMonth: Int,
    totals: FinanceTotals,
    onSelectBudget: (Long?) -> Unit,
    onSelectMonth: (Int) -> Unit
) {
    val timeline = remember(uiState.revenues, uiState.expenses) {
        buildTimeline(uiState.revenues, uiState.expenses).take(5)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            BudgetContextCard(
                budgets = uiState.budgets,
                selectedBudgetId = uiState.selectedBudgetId,
                selectedMonth = selectedMonth,
                months = months,
                onSelectBudget = onSelectBudget,
                onSelectMonth = onSelectMonth
            )
        }
        item {
            BalanceHeroCard(totals = totals)
        }
        item {
            MonthOverviewCard(totals = totals)
        }
        item {
            TimelineCard(items = timeline)
        }
    }
}

@Composable
private fun RevenuesScreen(
    padding: PaddingValues,
    uiState: FinanceUiState,
    totals: FinanceTotals,
    onToggleRevenueStatus: (Long) -> Unit,
    onEditRevenue: (RevenueItem) -> Unit,
    onDeleteRevenue: (Long) -> Unit
) {
    var filterName by rememberSaveable { mutableStateOf(EntryFilter.All.name) }
    val filter = remember(filterName) {
        EntryFilter.entries.firstOrNull { it.name == filterName } ?: EntryFilter.All
    }
    val filtered = remember(uiState.revenues, filter) {
        uiState.revenues.filter {
            when (filter) {
                EntryFilter.All -> true
                EntryFilter.Open -> it.status.equals("Pendente", ignoreCase = true)
                EntryFilter.Closed -> it.status.equals("Recebido", ignoreCase = true)
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            SectionSummaryCard(
                title = "Receitas",
                primaryLabel = "Recebido",
                primaryValue = totals.totalRecebido,
                secondaryLabel = "Lançado",
                secondaryValue = totals.totalReceitas,
                tone = HfGreen
            )
        }
        item {
            FilterRow(
                current = filter,
                onSelect = { filterName = it.name }
            )
        }
        if (filtered.isEmpty()) {
            item { EmptyCard("Nenhuma receita para o filtro selecionado.") }
        } else {
            items(filtered, key = { it.id }) { revenue ->
                RevenueRow(
                    revenue = revenue,
                    onToggleStatus = onToggleRevenueStatus,
                    onEdit = onEditRevenue,
                    onDelete = onDeleteRevenue
                )
            }
        }
    }
}

@Composable
private fun ExpensesScreen(
    padding: PaddingValues,
    uiState: FinanceUiState,
    totals: FinanceTotals,
    onToggleExpenseStatus: (Long) -> Unit,
    onEditExpense: (ExpenseItem) -> Unit,
    onDeleteExpense: (Long) -> Unit
) {
    var filterName by rememberSaveable { mutableStateOf(EntryFilter.All.name) }
    val filter = remember(filterName) {
        EntryFilter.entries.firstOrNull { it.name == filterName } ?: EntryFilter.All
    }
    val filtered = remember(uiState.expenses, filter) {
        uiState.expenses.filter {
            when (filter) {
                EntryFilter.All -> true
                EntryFilter.Open -> it.status.equals("Pendente", ignoreCase = true)
                EntryFilter.Closed -> it.status.equals("Pago", ignoreCase = true)
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            SectionSummaryCard(
                title = "Despesas",
                primaryLabel = "Pago",
                primaryValue = totals.totalPago,
                secondaryLabel = "Lançado",
                secondaryValue = totals.totalDespesas,
                tone = HfRed
            )
        }
        item {
            FilterRow(
                current = filter,
                onSelect = { filterName = it.name }
            )
        }
        if (filtered.isEmpty()) {
            item { EmptyCard("Nenhuma despesa para o filtro selecionado.") }
        } else {
            items(filtered, key = { it.id }) { expense ->
                ExpenseRow(
                    expense = expense,
                    onToggleStatus = onToggleExpenseStatus,
                    onEdit = onEditExpense,
                    onDelete = onDeleteExpense
                )
            }
        }
    }
}

@Composable
private fun CardsScreen(
    padding: PaddingValues,
    uiState: FinanceUiState,
    months: List<Int>,
    selectedMonth: Int,
    openVersion: Int,
    onSelectMonth: (Int) -> Unit,
    onOpenLimitSheet: () -> Unit,
    onCloseInvoice: (Long, Long, Int) -> Unit,
    onReopenInvoice: (Long, Long, Int) -> Unit,
    onEditCardCharge: (CardChargeItem) -> Unit,
    onDeleteCardCharge: (Long) -> Unit
) {
    var selectedCardId by rememberSaveable { mutableStateOf<Long?>(null) }
    val selectedBudgetId = uiState.selectedBudgetId

    LaunchedEffect(uiState.cards, uiState.cardSummaries, selectedMonth, selectedBudgetId) {
        if (selectedCardId == null || uiState.cards.none { it.id == selectedCardId }) {
            val openCardId = uiState.cardSummaries.firstOrNull {
                it.budgetId == selectedBudgetId &&
                    it.month == selectedMonth &&
                    !it.isClosed &&
                    it.invoiceCents > 0L
            }?.cardId
            selectedCardId = openCardId ?: uiState.cards.firstOrNull()?.id
        }
    }
    LaunchedEffect(openVersion, uiState.selectedBudgetId) {
        selectedCardId = null
    }

    val selectedCard = uiState.cards.firstOrNull { it.id == selectedCardId }
    val summary = uiState.cardSummaries.firstOrNull {
        it.cardId == selectedCardId && it.budgetId == selectedBudgetId && it.month == selectedMonth
    }
    val charges = uiState.cardCharges.filter {
        it.month == selectedMonth && (selectedCardId == null || it.cardId == selectedCardId)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            ElevatedPanel {
                Text(
                    text = "Selecione o cartão e o mês da fatura",
                    style = MaterialTheme.typography.bodySmall,
                    color = HfMuted
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CardDropdown(
                        cards = uiState.cards,
                        selectedId = selectedCardId,
                        onSelect = { selectedCardId = it },
                        modifier = Modifier.weight(1f)
                    )
                    MonthDropdown(
                        months = months,
                        selectedMonth = selectedMonth,
                        onSelect = onSelectMonth,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
        item {
            if (selectedCard == null || summary == null) {
                EmptyCard("Cadastre um cartão para controlar faturas.")
            } else {
                CardInvoiceSummaryCard(
                    card = selectedCard,
                    summary = summary,
                    onOpenLimitSheet = onOpenLimitSheet,
                    onCloseInvoice = {
                        onCloseInvoice(summary.cardId, summary.budgetId, summary.month)
                    },
                    onReopenInvoice = {
                        onReopenInvoice(summary.cardId, summary.budgetId, summary.month)
                    }
                )
            }
        }
        if (charges.isEmpty()) {
            item { EmptyCard("Nenhum lançamento nesta fatura.") }
        } else {
            items(charges, key = { it.id }) { charge ->
                CardChargeRow(
                    charge = charge,
                    invoiceClosed = summary?.isClosed == true,
                    onEdit = { onEditCardCharge(charge) },
                    onDelete = { onDeleteCardCharge(charge.id) }
                )
            }
        }
    }
}

@Composable
private fun MoreScreen(
    padding: PaddingValues,
    section: MoreSection,
    uiState: FinanceUiState,
    totals: FinanceTotals,
    onOpenRelatorios: () -> Unit,
    onOpenConfiguracoes: () -> Unit,
    onOpenBudgetSheet: () -> Unit,
    onEditBudget: (BudgetItem) -> Unit,
    onOpenCategorySheet: () -> Unit,
    onEditCategory: (CategoryItem) -> Unit,
    onOpenInitialBalanceSheet: () -> Unit,
    onOpenPredefinedExpenseSheet: () -> Unit,
    onEditPredefinedExpense: (PredefinedExpenseItem) -> Unit,
    onOpenPredefinedRevenueSheet: () -> Unit,
    onEditPredefinedRevenue: (PredefinedRevenueItem) -> Unit,
    onOpenCardSheet: () -> Unit,
    onEditCard: (CardItem) -> Unit,
    onOpenCardLimitSheet: () -> Unit
) {
    when (section) {
        MoreSection.Menu -> MoreMenu(
            padding = padding,
            onOpenRelatorios = onOpenRelatorios,
            onOpenConfiguracoes = onOpenConfiguracoes
        )
        MoreSection.Relatorios -> ReportsScreen(
            padding = padding,
            uiState = uiState,
            totals = totals
        )
        MoreSection.Configuracoes -> SettingsScreen(
            padding = padding,
            uiState = uiState,
            onOpenBudgetSheet = onOpenBudgetSheet,
            onEditBudget = onEditBudget,
            onOpenCategorySheet = onOpenCategorySheet,
            onEditCategory = onEditCategory,
            onOpenInitialBalanceSheet = onOpenInitialBalanceSheet,
            onOpenPredefinedExpenseSheet = onOpenPredefinedExpenseSheet,
            onEditPredefinedExpense = onEditPredefinedExpense,
            onOpenPredefinedRevenueSheet = onOpenPredefinedRevenueSheet,
            onEditPredefinedRevenue = onEditPredefinedRevenue,
            onOpenCardSheet = onOpenCardSheet,
            onEditCard = onEditCard,
            onOpenCardLimitSheet = onOpenCardLimitSheet
        )
    }
}

@Composable
private fun MoreMenu(
    padding: PaddingValues,
    onOpenRelatorios: () -> Unit,
    onOpenConfiguracoes: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            MoreActionCard(
                title = "Relatórios",
                subtitle = "Totais por categoria e consolidado do orçamento",
                icon = Icons.AutoMirrored.Filled.List,
                onClick = onOpenRelatorios
            )
        }
        item {
            MoreActionCard(
                title = "Configurações",
                subtitle = "Orçamentos e categorias locais",
                icon = Icons.Filled.Settings,
                onClick = onOpenConfiguracoes
            )
        }
    }
}

@Composable
private fun ReportsScreen(
    padding: PaddingValues,
    uiState: FinanceUiState,
    totals: FinanceTotals
) {
    val revenuesByCategory = remember(uiState.revenues) {
        uiState.revenues
            .groupBy { it.categoryName ?: "Sem categoria" }
            .mapValues { (_, values) -> values.sumOf { it.amountCents } }
            .toList()
            .sortedByDescending { it.second }
    }
    val expensesByCategory = remember(uiState.expenses) {
        uiState.expenses
            .groupBy { it.categoryName ?: "Sem categoria" }
            .mapValues { (_, values) -> values.sumOf { it.amountCents } }
            .toList()
            .sortedByDescending { it.second }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            SectionSummaryCard(
                title = "Resultado",
                primaryLabel = "Saldo atual",
                primaryValue = totals.saldoAtual,
                secondaryLabel = "Previsto",
                secondaryValue = totals.saldoPrevisto,
                tone = if (totals.saldoAtual >= 0L) HfBlue else HfRed
            )
        }
        item {
            CategoryTotalsCard(
                title = "Receitas por categoria",
                entries = revenuesByCategory,
                tone = HfGreen
            )
        }
        item {
            CategoryTotalsCard(
                title = "Despesas por categoria",
                entries = expensesByCategory,
                tone = HfRed
            )
        }
        item {
            CardReportCard(summaries = uiState.cardSummaries)
        }
    }
}

@Composable
private fun SettingsScreen(
    padding: PaddingValues,
    uiState: FinanceUiState,
    onOpenBudgetSheet: () -> Unit,
    onEditBudget: (BudgetItem) -> Unit,
    onOpenCategorySheet: () -> Unit,
    onEditCategory: (CategoryItem) -> Unit,
    onOpenInitialBalanceSheet: () -> Unit,
    onOpenPredefinedExpenseSheet: () -> Unit,
    onEditPredefinedExpense: (PredefinedExpenseItem) -> Unit,
    onOpenPredefinedRevenueSheet: () -> Unit,
    onEditPredefinedRevenue: (PredefinedRevenueItem) -> Unit,
    onOpenCardSheet: () -> Unit,
    onEditCard: (CardItem) -> Unit,
    onOpenCardLimitSheet: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            SettingsCard(
                title = "Orçamentos",
                actionLabel = "Novo orçamento",
                onAction = onOpenBudgetSheet
            ) {
                if (uiState.budgets.isEmpty()) {
                    Text("Nenhum orçamento cadastrado.", color = HfMuted)
                } else {
                    uiState.budgets.forEach { budget ->
                        SettingsLine(
                            title = "Ano ${budget.year}",
                            detail = if (budget.isActive) "Ativo" else "Inativo",
                            onEdit = { onEditBudget(budget) }
                        )
                    }
                }
            }
        }
        item {
            SettingsCard(
                title = "Saldo inicial",
                actionLabel = "Atualizar",
                onAction = onOpenInitialBalanceSheet
            ) {
                val selected = uiState.budgets.firstOrNull { it.id == uiState.selectedBudgetId }
                SettingsLine(
                    title = selected?.let { "Orçamento ${it.year}" } ?: "Sem orçamento",
                    detail = formatMoney(selected?.initialBalanceCents ?: 0L)
                )
            }
        }
        item {
            SettingsCard(
                title = "Categorias",
                actionLabel = "Nova categoria",
                onAction = onOpenCategorySheet
            ) {
                val categories = uiState.categoriesRevenue + uiState.categoriesExpense
                if (categories.isEmpty()) {
                    Text("Nenhuma categoria cadastrada.", color = HfMuted)
                } else {
                    categories.forEach { category ->
                        SettingsLine(
                            title = category.name,
                            detail = category.type.name,
                            onEdit = { onEditCategory(category) }
                        )
                    }
                }
            }
        }
        item {
            SettingsCard(
                title = "Gastos pré-definidos",
                actionLabel = "Novo gasto",
                onAction = onOpenPredefinedExpenseSheet
            ) {
                if (uiState.predefinedExpenses.isEmpty()) {
                    Text("Nenhum gasto pré-definido.", color = HfMuted)
                } else {
                    uiState.predefinedExpenses.take(8).forEach { item ->
                        val category = uiState.categoriesExpense.firstOrNull { it.id == item.categoryId }?.name ?: "Sem categoria"
                        SettingsLine(
                            title = item.description,
                            detail = category,
                            onEdit = { onEditPredefinedExpense(item) }
                        )
                    }
                }
            }
        }
        item {
            SettingsCard(
                title = "Receitas pré-definidas",
                actionLabel = "Nova receita",
                onAction = onOpenPredefinedRevenueSheet
            ) {
                if (uiState.predefinedRevenues.isEmpty()) {
                    Text("Nenhuma receita pré-definida.", color = HfMuted)
                } else {
                    uiState.predefinedRevenues.take(8).forEach { item ->
                        SettingsLine(
                            title = item.description,
                            detail = if (item.isRecurring) "Recorrente" else "Eventual",
                            onEdit = { onEditPredefinedRevenue(item) }
                        )
                    }
                }
            }
        }
        item {
            SettingsCard(
                title = "Cartões",
                actionLabel = "Novo cartão",
                onAction = onOpenCardSheet
            ) {
                if (uiState.cards.isEmpty()) {
                    Text("Nenhum cartão cadastrado.", color = HfMuted)
                } else {
                    uiState.cards.forEach { card ->
                        SettingsLine(
                            title = card.name,
                            detail = formatMoney(card.defaultLimitCents),
                            onEdit = { onEditCard(card) }
                        )
                    }
                    TextButton(onClick = onOpenCardLimitSheet) {
                        Text("Ajustar limite mensal")
                    }
                }
            }
        }
    }
}

@Composable
private fun BudgetContextCard(
    budgets: List<BudgetItem>,
    selectedBudgetId: Long?,
    selectedMonth: Int,
    months: List<Int>,
    onSelectBudget: (Long?) -> Unit,
    onSelectMonth: (Int) -> Unit
) {
    ElevatedPanel {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Contexto financeiro",
                    style = MaterialTheme.typography.bodySmall,
                    color = HfMuted
                )
                StatusBadge(
                    text = "Local",
                    color = HfTeal
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                BudgetDropdown(
                    budgets = budgets,
                    selectedBudgetId = selectedBudgetId,
                    onSelectBudget = onSelectBudget,
                    modifier = Modifier.weight(1f)
                )
                MonthDropdown(
                    months = months,
                    selectedMonth = selectedMonth,
                    onSelect = onSelectMonth,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun BudgetDropdown(
    budgets: List<BudgetItem>,
    selectedBudgetId: Long?,
    onSelectBudget: (Long?) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    val selected = budgets.firstOrNull { it.id == selectedBudgetId }
    val label = selected?.let { "Orçamento ${it.year}" } ?: "Selecionar orçamento"

    Box(modifier = modifier) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(999.dp))
                .background(HfSurfaceMuted)
                .clickable { expanded = true }
                .padding(horizontal = 12.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelLarge,
                color = HfText,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            Icon(
                imageVector = Icons.Filled.ArrowDropDown,
                contentDescription = null,
                tint = HfMuted,
                modifier = Modifier.size(18.dp)
            )
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            budgets.forEach { budget ->
                DropdownMenuItem(
                    text = { Text("Orçamento ${budget.year}") },
                    onClick = {
                        expanded = false
                        onSelectBudget(budget.id)
                    }
                )
            }
        }
    }
}

@Composable
private fun BalanceHeroCard(totals: FinanceTotals) {
    val balanceColor = if (totals.saldoAtual >= 0L) HfBlue else HfRed
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = HfBlueSoft),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Saldo atual em conta",
                        style = MaterialTheme.typography.bodySmall,
                        color = HfMuted
                    )
                    Text(
                        text = formatMoney(totals.saldoAtual),
                        style = MaterialTheme.typography.titleLarge,
                        color = balanceColor,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
                Surface(
                    shape = CircleShape,
                    color = Color.White.copy(alpha = 0.74f)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Home,
                        contentDescription = null,
                        tint = HfBlue,
                        modifier = Modifier
                            .padding(10.dp)
                            .size(22.dp)
                    )
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                MiniMetric("Previsto", totals.saldoPrevisto, Modifier.weight(1f))
                MiniMetric("Recebido", totals.totalRecebido, Modifier.weight(1f))
                MiniMetric("Pago", totals.totalPago, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun MiniMetric(
    label: String,
    amountCents: Long,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        color = Color.White.copy(alpha = 0.82f)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(label, color = HfMuted, style = MaterialTheme.typography.bodySmall)
            Text(
                text = formatCompactMoney(amountCents),
                style = MaterialTheme.typography.labelLarge,
                color = HfText,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun MonthOverviewCard(totals: FinanceTotals) {
    ElevatedPanel {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = "Execução do orçamento",
                style = MaterialTheme.typography.titleMedium,
                color = HfText
            )
            ProgressBlock(
                title = "Receitas",
                realizedLabel = "Recebido",
                realized = totals.totalRecebido,
                planned = totals.totalReceitas,
                remainingLabel = "Falta receber",
                remaining = totals.pendenteReceita,
                tone = HfGreen
            )
            ProgressBlock(
                title = "Despesas",
                realizedLabel = "Realizado",
                realized = totals.totalPago,
                planned = totals.totalDespesas,
                remainingLabel = "Restante",
                remaining = totals.pendenteDespesa,
                tone = HfRed
            )
        }
    }
}

@Composable
private fun ProgressBlock(
    title: String,
    realizedLabel: String,
    realized: Long,
    planned: Long,
    remainingLabel: String,
    remaining: Long,
    tone: Color
) {
    val progress = if (planned <= 0L) 0f else (realized.toFloat() / planned.toFloat()).coerceIn(0f, 1f)
    Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(title, style = MaterialTheme.typography.labelLarge, color = HfText)
            Text("${(progress * 100f).roundToInt()}%", style = MaterialTheme.typography.labelMedium, color = tone)
        }
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(999.dp)),
            color = tone,
            trackColor = HfSurfaceMuted
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("$realizedLabel ${formatMoney(realized)}", style = MaterialTheme.typography.bodySmall, color = HfMuted)
            Text("$remainingLabel ${formatMoney(remaining)}", style = MaterialTheme.typography.bodySmall, color = HfMuted)
        }
    }
}

@Composable
private fun TimelineCard(items: List<TimelineItem>) {
    ElevatedPanel {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "Últimos lançamentos",
                style = MaterialTheme.typography.titleMedium,
                color = HfText
            )
            if (items.isEmpty()) {
                EmptyInline("Nenhum lançamento cadastrado.")
            } else {
                items.forEachIndexed { index, item ->
                    TimelineRow(item)
                    if (index != items.lastIndex) {
                        HorizontalDivider(color = HfBorder)
                    }
                }
            }
        }
    }
}

@Composable
private fun TimelineRow(item: TimelineItem) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = CircleShape,
                color = if (item.isIncome) HfGreen.copy(alpha = 0.12f) else HfRed.copy(alpha = 0.12f)
            ) {
                Icon(
                    imageVector = if (item.isIncome) Icons.Filled.CheckCircle else Icons.Filled.ShoppingCart,
                    contentDescription = null,
                    tint = if (item.isIncome) HfGreen else HfRed,
                    modifier = Modifier
                        .padding(8.dp)
                        .size(18.dp)
                )
            }
            Column {
                Text(
                    item.title,
                    style = MaterialTheme.typography.labelLarge,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    "${item.category} - ${item.status}",
                    style = MaterialTheme.typography.bodySmall,
                    color = HfMuted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        Text(
            text = formatMoney(item.amountCents),
            style = MaterialTheme.typography.labelLarge,
            color = if (item.isIncome) HfGreen else HfRed
        )
    }
}

@Composable
private fun SectionSummaryCard(
    title: String,
    primaryLabel: String,
    primaryValue: Long,
    secondaryLabel: String,
    secondaryValue: Long,
    tone: Color
) {
    ElevatedPanel {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, color = HfText)
                Text(primaryLabel, style = MaterialTheme.typography.bodySmall, color = HfMuted)
                Text(
                    formatMoney(primaryValue),
                    style = MaterialTheme.typography.titleLarge,
                    color = tone,
                    fontWeight = FontWeight.ExtraBold
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(secondaryLabel, style = MaterialTheme.typography.bodySmall, color = HfMuted)
                Text(formatMoney(secondaryValue), style = MaterialTheme.typography.labelLarge, color = HfText)
            }
        }
    }
}

@Composable
private fun FilterRow(
    current: EntryFilter,
    onSelect: (EntryFilter) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        EntryFilter.entries.forEach { filter ->
            FilterChip(
                selected = filter == current,
                onClick = { onSelect(filter) },
                label = { Text(filter.label) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = HfBlueSoft,
                    selectedLabelColor = HfBlue
                )
            )
        }
    }
}

@Composable
private fun RevenueRow(
    revenue: RevenueItem,
    onToggleStatus: (Long) -> Unit,
    onEdit: (RevenueItem) -> Unit,
    onDelete: (Long) -> Unit
) {
    EntryRow(
        title = revenue.description,
        category = revenue.categoryName ?: "Sem categoria",
        amountCents = revenue.amountCents,
        status = revenue.status,
        tone = HfGreen,
        completed = revenue.status.equals("Recebido", ignoreCase = true),
        onToggleStatus = { onToggleStatus(revenue.id) },
        onEdit = { onEdit(revenue) },
        onDelete = { onDelete(revenue.id) }
    )
}

@Composable
private fun ExpenseRow(
    expense: ExpenseItem,
    onToggleStatus: (Long) -> Unit,
    onEdit: (ExpenseItem) -> Unit,
    onDelete: (Long) -> Unit
) {
    EntryRow(
        title = expense.description,
        category = expense.categoryName ?: "Sem categoria",
        amountCents = expense.amountCents,
        status = expense.status,
        tone = HfRed,
        completed = expense.status.equals("Pago", ignoreCase = true),
        onToggleStatus = { onToggleStatus(expense.id) },
        canEdit = !expense.isCardInvoice,
        onEdit = { onEdit(expense) },
        onDelete = { onDelete(expense.id) }
    )
}

@Composable
private fun EntryRow(
    title: String,
    category: String,
    amountCents: Long,
    status: String,
    tone: Color,
    completed: Boolean,
    onToggleStatus: () -> Unit,
    canEdit: Boolean = true,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = HfSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(48.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(tone)
            )
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            title,
                            style = MaterialTheme.typography.labelLarge,
                            color = HfText,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            category,
                            style = MaterialTheme.typography.bodySmall,
                            color = HfMuted,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Text(
                        formatMoney(amountCents),
                        style = MaterialTheme.typography.labelLarge,
                        color = tone
                    )
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    FilterChip(
                        selected = completed,
                        onClick = onToggleStatus,
                        label = { Text(status) },
                        leadingIcon = if (completed) {
                            {
                                Icon(
                                    imageVector = Icons.Filled.CheckCircle,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        } else {
                            null
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = tone.copy(alpha = 0.12f),
                            selectedLabelColor = tone,
                            selectedLeadingIconColor = tone
                        )
                    )
                    IconButton(
                        onClick = onEdit,
                        enabled = canEdit,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Edit,
                            contentDescription = "Editar",
                            tint = if (canEdit) HfMuted else HfBorder,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Excluir",
                            tint = HfMuted,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CardInvoiceSummaryCard(
    card: CardItem,
    summary: CardMonthlySummary,
    onOpenLimitSheet: () -> Unit,
    onCloseInvoice: () -> Unit,
    onReopenInvoice: () -> Unit
) {
    ElevatedPanel {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(card.name, style = MaterialTheme.typography.titleMedium, color = HfText)
                Text(
                    "${monthName(summary.month)} - ${if (summary.isClosed) "Fatura fechada" else "Fatura aberta"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = HfMuted
                )
            }
            StatusBadge(
                text = if (summary.isClosed) "Fechada" else "Aberta",
                color = if (summary.isClosed) HfAmber else HfTeal
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            MiniMetric("Limite", summary.limitCents, Modifier.weight(1f))
            MiniMetric("Fatura", summary.invoiceCents, Modifier.weight(1f))
            MiniMetric("Disponível", summary.availableCents, Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(
                onClick = onOpenLimitSheet,
                modifier = Modifier.weight(1f)
            ) {
                Text("Limite")
            }
            if (summary.isClosed) {
                OutlinedButton(
                    onClick = onReopenInvoice,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Reabrir")
                }
            } else {
                Button(
                    onClick = onCloseInvoice,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Fechar fatura")
                }
            }
        }
    }
}

@Composable
private fun CardChargeRow(
    charge: CardChargeItem,
    invoiceClosed: Boolean,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val isCredit = charge.movement == CardMovement.CREDITO
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = HfSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(48.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (isCredit) HfGreen else HfAmber)
            )
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            charge.description,
                            style = MaterialTheme.typography.labelLarge,
                            color = HfText,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            "${charge.cardName} - ${charge.categoryName ?: "Sem categoria"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = HfMuted,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Text(
                        formatMoney(charge.amountCents),
                        style = MaterialTheme.typography.labelLarge,
                        color = if (isCredit) HfGreen else HfRed
                    )
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    StatusBadge(
                        text = if (isCredit) "Crédito" else recurrenceLabel(charge.recurrenceType),
                        color = if (isCredit) HfGreen else HfBlue
                    )
                    IconButton(
                        onClick = onEdit,
                        enabled = !invoiceClosed,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Edit,
                            contentDescription = "Editar",
                            tint = if (invoiceClosed) HfBorder else HfMuted,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    IconButton(
                        onClick = onDelete,
                        enabled = !invoiceClosed,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Excluir",
                            tint = if (invoiceClosed) HfBorder else HfMuted,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MoreActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = HfSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = HfBlueSoft,
                contentColor = HfBlue
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier
                        .padding(10.dp)
                        .size(22.dp)
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = HfText)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = HfMuted)
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = HfMuted
            )
        }
    }
}

@Composable
private fun CategoryTotalsCard(
    title: String,
    entries: List<Pair<String, Long>>,
    tone: Color
) {
    ElevatedPanel {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = HfText)
            if (entries.isEmpty()) {
                EmptyInline("Sem dados para este orçamento.")
            } else {
                entries.forEachIndexed { index, entry ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            entry.first,
                            style = MaterialTheme.typography.bodyMedium,
                            color = HfText,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            formatMoney(entry.second),
                            style = MaterialTheme.typography.labelLarge,
                            color = tone
                        )
                    }
                    if (index != entries.lastIndex) {
                        HorizontalDivider(color = HfBorder)
                    }
                }
            }
        }
    }
}

@Composable
private fun CardReportCard(summaries: List<CardMonthlySummary>) {
    val active = summaries
        .filter { it.invoiceCents > 0L || it.limitCents > 0L }
        .sortedWith(compareBy<CardMonthlySummary> { it.month }.thenBy { it.cardName })
        .take(12)
    ElevatedPanel {
        Text("Cartões", style = MaterialTheme.typography.titleMedium, color = HfText)
        if (active.isEmpty()) {
            EmptyInline("Sem faturas para o orçamento selecionado.")
        } else {
            active.forEachIndexed { index, item ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(item.cardName, style = MaterialTheme.typography.bodyMedium, color = HfText)
                        Text(
                            "${monthName(item.month)} - ${if (item.isClosed) "fechada" else "aberta"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = HfMuted
                        )
                    }
                    Text(formatMoney(item.invoiceCents), style = MaterialTheme.typography.labelLarge, color = HfAmber)
                }
                if (index != active.lastIndex) {
                    HorizontalDivider(color = HfBorder)
                }
            }
        }
    }
}

@Composable
private fun SettingsCard(
    title: String,
    actionLabel: String,
    onAction: () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    ElevatedPanel {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = HfText)
                TextButton(onClick = onAction) {
                    Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(17.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(actionLabel)
                }
            }
            content()
        }
    }
}

@Composable
private fun SettingsLine(
    title: String,
    detail: String,
    onEdit: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                title,
                style = MaterialTheme.typography.bodyMedium,
                color = HfText,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                detail,
                style = MaterialTheme.typography.bodySmall,
                color = HfMuted,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        if (onEdit != null) {
            IconButton(
                onClick = onEdit,
                modifier = Modifier.size(34.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.Edit,
                    contentDescription = "Editar",
                    tint = HfMuted,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
private fun ElevatedPanel(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = HfSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            content = content
        )
    }
}

@Composable
private fun StatusBadge(
    text: String,
    color: Color
) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = color.copy(alpha = 0.12f),
        contentColor = color
    ) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            style = MaterialTheme.typography.labelMedium
        )
    }
}

@Composable
private fun EmptyCard(message: String) {
    ElevatedPanel {
        EmptyInline(message)
    }
}

@Composable
private fun EmptyInline(message: String) {
    Text(
        text = message,
        style = MaterialTheme.typography.bodyMedium,
        color = HfMuted
    )
}

@Composable
private fun CurrencyTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Valor"
) {
    var fieldValue by rememberSaveable(stateSaver = TextFieldValue.Saver) {
        val initialText = sanitizeCurrencyInput(value)
        mutableStateOf(
            TextFieldValue(
                text = initialText,
                selection = TextRange(currencyCursorPosition(initialText))
            )
        )
    }

    LaunchedEffect(value) {
        val normalizedValue = sanitizeCurrencyInput(value)
        if (normalizedValue != fieldValue.text) {
            fieldValue = TextFieldValue(
                text = normalizedValue,
                selection = TextRange(currencyCursorPosition(normalizedValue))
            )
        }
    }

    OutlinedTextField(
        value = fieldValue,
        onValueChange = { input ->
            val normalizedText = sanitizeCurrencyInput(input.text)
            val cursor = input.selection.end.coerceIn(0, normalizedText.length)
            fieldValue = TextFieldValue(
                text = normalizedText,
                selection = TextRange(cursor)
            )
            onValueChange(normalizedText)
        },
        label = { Text(label) },
        prefix = { Text("R$ ") },
        placeholder = { Text("0,00") },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        modifier = modifier
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BrazilianDateField(
    dateIso: String,
    onDateSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var calendarOpen by rememberSaveable { mutableStateOf(false) }
    Box(modifier = modifier) {
        OutlinedTextField(
            value = formatDateBr(dateIso),
            onValueChange = {},
            label = { Text("Data") },
            placeholder = { Text("DD/MM/AAAA") },
            readOnly = true,
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        Box(
            modifier = Modifier
                .matchParentSize()
                .clickable { calendarOpen = true }
        )
    }

    if (calendarOpen) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = null,
            initialDisplayedMonthMillis = todayUtcMillis()
        )
        DatePickerDialog(
            onDismissRequest = { calendarOpen = false },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { calendarOpen = false }) {
                    Text("Cancelar")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
        LaunchedEffect(datePickerState.selectedDateMillis) {
            datePickerState.selectedDateMillis?.let { selectedMillis ->
                onDateSelected(isoDateFromUtcMillis(selectedMillis))
                calendarOpen = false
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun EntrySheet(
    title: String,
    categories: List<CategoryItem>,
    predefinedDescriptions: List<PredefinedDescriptionOption> = emptyList(),
    saveLabel: String,
    closedStatusLabel: String,
    months: List<Int>,
    initialMonth: Int,
    initialDescription: String = "",
    initialComplement: String = "",
    initialAmount: String = "",
    initialCategoryId: Long? = null,
    initialDateIso: String = "",
    initialStatus: String = "Pendente",
    initialRecurrenceType: RecurrenceType = RecurrenceType.EVENTUAL,
    initialInstallments: String = "1",
    initialRecurrenceMonths: List<Int> = listOf(initialMonth),
    showRecurrence: Boolean = true,
    onDismiss: () -> Unit,
    onSave: (
        description: String,
        amount: String,
        categoryId: Long?,
        complement: String?,
        month: Int,
        dateIso: String?,
        status: String,
        recurrenceType: RecurrenceType,
        installments: String,
        recurrenceMonths: List<Int>
    ) -> Unit
) {
    var description by rememberSaveable { mutableStateOf(initialDescription) }
    var complement by rememberSaveable { mutableStateOf(initialComplement) }
    var amount by rememberSaveable { mutableStateOf(initialAmount) }
    var selectedCategoryId by rememberSaveable { mutableStateOf<Long?>(initialCategoryId) }
    val selectedMonth = initialMonth
    var dateIso by rememberSaveable { mutableStateOf(initialDateIso) }
    var status by rememberSaveable { mutableStateOf(initialStatus) }
    var recurrenceName by rememberSaveable { mutableStateOf(initialRecurrenceType.name) }
    var installments by rememberSaveable { mutableStateOf(initialInstallments) }
    var recurrenceMonths by rememberSaveable { mutableStateOf(initialRecurrenceMonths.ifEmpty { listOf(selectedMonth) }) }
    val recurrence = RecurrenceType.valueOf(recurrenceName)
    val canSave = description.isNotBlank() && amount.isNotBlank() && selectedCategoryId != null

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = title) {
            DescriptionDropdownField(
                value = description,
                onValueChange = { description = it },
                options = predefinedDescriptions,
                onSelect = { option ->
                    description = option.description
                    option.categoryId?.let { selectedCategoryId = it }
                },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = complement,
                onValueChange = { complement = it },
                label = { Text("Complemento") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            CurrencyTextField(
                value = amount,
                onValueChange = { amount = it },
                modifier = Modifier.fillMaxWidth()
            )
            CategoryDropdown(
                categories = categories,
                selectedId = selectedCategoryId,
                fallbackLabel = "Selecione categoria",
                onSelect = { selectedCategoryId = it }
            )
            BrazilianDateField(
                dateIso = dateIso,
                onDateSelected = { dateIso = it },
                modifier = Modifier.fillMaxWidth()
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = status == "Pendente",
                    onClick = { status = "Pendente" },
                    label = { Text("Pendente") }
                )
                FilterChip(
                    selected = status == closedStatusLabel,
                    onClick = { status = closedStatusLabel },
                    label = { Text(closedStatusLabel) }
                )
            }
            if (showRecurrence) {
                RecurrenceSelector(
                    selected = recurrence,
                    onSelect = {
                        recurrenceName = it.name
                        if (it == RecurrenceType.EVENTUAL || recurrenceMonths.isEmpty()) {
                            recurrenceMonths = listOf(selectedMonth)
                        }
                    }
                )
            }
            if (showRecurrence && recurrence == RecurrenceType.FIXO) {
                MonthChips(
                    months = months,
                    selectedMonths = recurrenceMonths,
                    onToggle = { month ->
                        recurrenceMonths = if (month in recurrenceMonths) {
                            recurrenceMonths - month
                        } else {
                            (recurrenceMonths + month).distinct().sorted()
                        }.ifEmpty { listOf(selectedMonth) }
                    }
                )
            }
            if (showRecurrence && recurrence == RecurrenceType.PARCELADO) {
                OutlinedTextField(
                    value = installments,
                    onValueChange = { installments = it.filter(Char::isDigit).take(2) },
                    label = { Text("Parcelas") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
            }
            Button(
                onClick = {
                    onSave(
                        description,
                        amount,
                        selectedCategoryId,
                        complement.takeIf { it.isNotBlank() },
                        selectedMonth,
                        dateIso.takeIf { it.isNotBlank() },
                        status,
                        recurrence,
                        installments,
                        recurrenceMonths
                    )
                },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(saveLabel)
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun BudgetSheet(
    title: String = "Novo orçamento",
    saveLabel: String = "Salvar orçamento",
    initialYear: String = "",
    onDismiss: () -> Unit,
    onSave: (String) -> Unit
) {
    var year by rememberSaveable { mutableStateOf(initialYear) }
    val canSave = year.length == 4

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = title) {
            OutlinedTextField(
                value = year,
                onValueChange = { year = it.filter(Char::isDigit).take(4) },
                label = { Text("Ano") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            Button(
                onClick = { onSave(year) },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(saveLabel)
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun CategorySheet(
    title: String = "Nova categoria",
    saveLabel: String = "Salvar categoria",
    initialName: String = "",
    initialType: CategoryType = CategoryType.DESPESA,
    onDismiss: () -> Unit,
    onSave: (String, CategoryType) -> Unit
) {
    var name by rememberSaveable { mutableStateOf(initialName) }
    var typeName by rememberSaveable { mutableStateOf(initialType.name) }
    val canSave = name.isNotBlank()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = title) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Nome") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = typeName == CategoryType.RECEITA.name,
                    onClick = { typeName = CategoryType.RECEITA.name },
                    label = { Text("Receita") }
                )
                FilterChip(
                    selected = typeName == CategoryType.DESPESA.name,
                    onClick = { typeName = CategoryType.DESPESA.name },
                    label = { Text("Despesa") }
                )
            }
            Button(
                onClick = { onSave(name, CategoryType.valueOf(typeName)) },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(saveLabel)
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun AmountSheet(
    title: String,
    label: String,
    saveLabel: String,
    onDismiss: () -> Unit,
    onSave: (String) -> Unit
) {
    var amount by rememberSaveable { mutableStateOf("") }
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = title) {
            CurrencyTextField(
                value = amount,
                onValueChange = { amount = it },
                label = label,
                modifier = Modifier.fillMaxWidth()
            )
            Button(
                onClick = { onSave(amount) },
                enabled = amount.isNotBlank(),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(saveLabel)
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun PredefinedExpenseSheet(
    title: String = "Novo gasto pré-definido",
    saveLabel: String = "Salvar gasto",
    categories: List<CategoryItem>,
    initialDescription: String = "",
    initialCategoryId: Long? = categories.firstOrNull()?.id,
    onDismiss: () -> Unit,
    onSave: (String, Long?) -> Unit
) {
    var description by rememberSaveable { mutableStateOf(initialDescription) }
    var selectedCategoryId by rememberSaveable { mutableStateOf<Long?>(initialCategoryId) }
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = title) {
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Descrição") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            CategoryDropdown(
                categories = categories,
                selectedId = selectedCategoryId,
                fallbackLabel = "Selecione categoria",
                onSelect = { selectedCategoryId = it }
            )
            Button(
                onClick = { onSave(description, selectedCategoryId) },
                enabled = description.isNotBlank() && selectedCategoryId != null,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(saveLabel)
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun PredefinedRevenueSheet(
    title: String = "Nova receita pré-definida",
    saveLabel: String = "Salvar receita",
    initialDescription: String = "",
    initialRecurring: Boolean = false,
    onDismiss: () -> Unit,
    onSave: (String, Boolean) -> Unit
) {
    var description by rememberSaveable { mutableStateOf(initialDescription) }
    var recurring by rememberSaveable { mutableStateOf(initialRecurring) }
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = title) {
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Descrição") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            FilterChip(
                selected = recurring,
                onClick = { recurring = !recurring },
                label = { Text(if (recurring) "Recorrente" else "Eventual") }
            )
            Button(
                onClick = { onSave(description, recurring) },
                enabled = description.isNotBlank(),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(saveLabel)
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun CardSheet(
    title: String = "Novo cartão",
    saveLabel: String = "Salvar cartão",
    initialName: String = "",
    initialLimit: String = "",
    onDismiss: () -> Unit,
    onSave: (String, String) -> Unit
) {
    var name by rememberSaveable { mutableStateOf(initialName) }
    var limit by rememberSaveable { mutableStateOf(initialLimit) }
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = title) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Nome do cartão") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            CurrencyTextField(
                value = limit,
                onValueChange = { limit = it },
                label = "Limite padrão",
                modifier = Modifier.fillMaxWidth()
            )
            Button(
                onClick = { onSave(name, limit) },
                enabled = name.isNotBlank(),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(saveLabel)
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun CardLimitSheet(
    cards: List<CardItem>,
    initialMonth: Int,
    onDismiss: () -> Unit,
    onSave: (Long?, Int, String) -> Unit
) {
    var selectedCardId by rememberSaveable { mutableStateOf<Long?>(cards.firstOrNull()?.id) }
    var limit by rememberSaveable { mutableStateOf("") }
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = "Limite mensal") {
            CardDropdown(cards = cards, selectedId = selectedCardId, onSelect = { selectedCardId = it })
            ContextMonthLine(selectedMonth = initialMonth)
            CurrencyTextField(
                value = limit,
                onValueChange = { limit = it },
                label = "Limite do mês",
                modifier = Modifier.fillMaxWidth()
            )
            Button(
                onClick = { onSave(selectedCardId, initialMonth, limit) },
                enabled = selectedCardId != null && limit.isNotBlank(),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Salvar limite")
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun CardChargeSheet(
    title: String,
    cards: List<CardItem>,
    categories: List<CategoryItem>,
    predefinedDescriptions: List<PredefinedDescriptionOption> = emptyList(),
    months: List<Int>,
    initialMonth: Int,
    initialCardId: Long? = cards.firstOrNull()?.id,
    initialCategoryId: Long? = categories.firstOrNull()?.id,
    initialDescription: String = "",
    initialComplement: String = "",
    initialAmount: String = "",
    initialMovement: CardMovement = CardMovement.DEBITO,
    initialDateIso: String = "",
    initialRecurrenceType: RecurrenceType = RecurrenceType.EVENTUAL,
    initialInstallments: String = "1",
    initialRecurrenceMonths: List<Int> = listOf(initialMonth),
    showRecurrence: Boolean = true,
    saveLabel: String = "Salvar lançamento",
    onDismiss: () -> Unit,
    onSave: (
        cardId: Long?,
        categoryId: Long?,
        description: String,
        amount: String,
        movement: CardMovement,
        complement: String?,
        month: Int,
        dateIso: String,
        recurrenceType: RecurrenceType,
        installments: String,
        recurrenceMonths: List<Int>
    ) -> Unit
) {
    var selectedCardId by rememberSaveable { mutableStateOf<Long?>(initialCardId) }
    var selectedCategoryId by rememberSaveable { mutableStateOf<Long?>(initialCategoryId) }
    var description by rememberSaveable { mutableStateOf(initialDescription) }
    var complement by rememberSaveable { mutableStateOf(initialComplement) }
    var amount by rememberSaveable { mutableStateOf(initialAmount) }
    var movementName by rememberSaveable { mutableStateOf(initialMovement.name) }
    var dateIso by rememberSaveable { mutableStateOf(initialDateIso) }
    var recurrenceName by rememberSaveable { mutableStateOf(initialRecurrenceType.name) }
    var installments by rememberSaveable { mutableStateOf(initialInstallments) }
    var recurrenceMonths by rememberSaveable { mutableStateOf(initialRecurrenceMonths.ifEmpty { listOf(initialMonth) }) }
    val recurrence = RecurrenceType.valueOf(recurrenceName)
    val movement = CardMovement.valueOf(movementName)
    val canSave = selectedCardId != null && selectedCategoryId != null && description.isNotBlank() && amount.isNotBlank()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = title) {
            CardDropdown(cards = cards, selectedId = selectedCardId, onSelect = { selectedCardId = it })
            CategoryDropdown(
                categories = categories,
                selectedId = selectedCategoryId,
                fallbackLabel = "Selecione categoria",
                onSelect = { selectedCategoryId = it }
            )
            DescriptionDropdownField(
                value = description,
                onValueChange = { description = it },
                options = predefinedDescriptions,
                onSelect = { option ->
                    description = option.description
                    option.categoryId?.let { selectedCategoryId = it }
                },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = complement,
                onValueChange = { complement = it },
                label = { Text("Complemento") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            CurrencyTextField(
                value = amount,
                onValueChange = { amount = it },
                modifier = Modifier.fillMaxWidth()
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = movement == CardMovement.DEBITO,
                    onClick = { movementName = CardMovement.DEBITO.name },
                    label = { Text("Débito") }
                )
                FilterChip(
                    selected = movement == CardMovement.CREDITO,
                    onClick = { movementName = CardMovement.CREDITO.name },
                    label = { Text("Crédito") }
                )
            }
            BrazilianDateField(
                dateIso = dateIso,
                onDateSelected = { dateIso = it },
                modifier = Modifier.fillMaxWidth()
            )
            if (showRecurrence) {
                RecurrenceSelector(
                    selected = recurrence,
                    onSelect = {
                        recurrenceName = it.name
                        if (it == RecurrenceType.EVENTUAL || recurrenceMonths.isEmpty()) {
                            recurrenceMonths = listOf(initialMonth)
                        }
                    }
                )
            }
            if (showRecurrence && recurrence == RecurrenceType.FIXO) {
                MonthChips(
                    months = months,
                    selectedMonths = recurrenceMonths,
                    onToggle = { month ->
                        recurrenceMonths = if (month in recurrenceMonths) {
                            recurrenceMonths - month
                        } else {
                            (recurrenceMonths + month).distinct().sorted()
                        }.ifEmpty { listOf(initialMonth) }
                    }
                )
            }
            if (showRecurrence && recurrence == RecurrenceType.PARCELADO) {
                OutlinedTextField(
                    value = installments,
                    onValueChange = { installments = it.filter(Char::isDigit).take(2) },
                    label = { Text("Parcelas") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
            }
            Button(
                onClick = {
                    onSave(
                        selectedCardId,
                        selectedCategoryId,
                        description,
                        amount,
                        movement,
                        complement.takeIf { it.isNotBlank() },
                        initialMonth,
                        dateIso,
                        recurrence,
                        installments,
                        recurrenceMonths
                    )
                },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(saveLabel)
            }
        }
    }
}

@Composable
private fun SheetContent(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(horizontal = 18.dp, vertical = 8.dp)
            .padding(bottom = 20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = HfText)
        content()
    }
}

@Composable
private fun MonthChips(
    months: List<Int>,
    selectedMonths: List<Int>,
    onToggle: (Int) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Meses do lançamento fixo", style = MaterialTheme.typography.bodySmall, color = HfMuted)
        months.chunked(4).forEach { rowMonths ->
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                rowMonths.forEach { month ->
                    FilterChip(
                        selected = month in selectedMonths,
                        onClick = { onToggle(month) },
                        label = { Text(monthName(month).take(3)) }
                    )
                }
            }
        }
    }
}

@Composable
private fun DescriptionDropdownField(
    value: String,
    onValueChange: (String) -> Unit,
    options: List<PredefinedDescriptionOption>,
    onSelect: (PredefinedDescriptionOption) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    Box(modifier = modifier) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text("Descrição") },
            singleLine = true,
            trailingIcon = {
                if (options.isNotEmpty()) {
                    IconButton(onClick = { expanded = true }) {
                        Icon(Icons.Filled.ArrowDropDown, contentDescription = "Selecionar descrição")
                    }
                }
            },
            modifier = Modifier.fillMaxWidth()
        )
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option.description) },
                    onClick = {
                        expanded = false
                        onSelect(option)
                    }
                )
            }
        }
    }
}

@Composable
private fun CategoryDropdown(
    categories: List<CategoryItem>,
    selectedId: Long?,
    fallbackLabel: String,
    onSelect: (Long?) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val selected = categories.firstOrNull { it.id == selectedId }
    val label = selected?.name ?: fallbackLabel

    Box {
        OutlinedButton(
            onClick = { expanded = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = HfText)
        ) {
            Text(label, modifier = Modifier.weight(1f))
            Icon(Icons.Filled.ArrowDropDown, contentDescription = null)
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            DropdownMenuItem(
                text = { Text(fallbackLabel) },
                onClick = {
                    expanded = false
                    onSelect(null)
                }
            )
            categories.forEach { category ->
                DropdownMenuItem(
                    text = { Text(category.name) },
                    onClick = {
                        expanded = false
                        onSelect(category.id)
                    }
                )
            }
        }
    }
}

@Composable
private fun CardDropdown(
    cards: List<CardItem>,
    selectedId: Long?,
    onSelect: (Long?) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    val selected = cards.firstOrNull { it.id == selectedId }
    val label = selected?.name ?: "Selecione o cartão"

    Box(modifier = modifier) {
        OutlinedButton(
            onClick = { expanded = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = HfText)
        ) {
            Text(label, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
            Icon(Icons.Filled.ArrowDropDown, contentDescription = null)
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            cards.forEach { card ->
                DropdownMenuItem(
                    text = { Text(card.name) },
                    onClick = {
                        expanded = false
                        onSelect(card.id)
                    }
                )
            }
        }
    }
}

@Composable
private fun ContextMonthLine(selectedMonth: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(HfSurfaceMuted)
            .padding(horizontal = 12.dp, vertical = 9.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("Mês do contexto", style = MaterialTheme.typography.bodySmall, color = HfMuted)
        Text(monthName(selectedMonth), style = MaterialTheme.typography.labelLarge, color = HfText)
    }
}

@Composable
private fun MonthDropdown(
    months: List<Int>,
    selectedMonth: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    Box(modifier = modifier) {
        OutlinedButton(
            onClick = { expanded = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = HfText)
        ) {
            Text(monthName(selectedMonth), modifier = Modifier.weight(1f))
            Icon(Icons.Filled.ArrowDropDown, contentDescription = null)
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            months.forEach { month ->
                DropdownMenuItem(
                    text = { Text(monthName(month)) },
                    onClick = {
                        expanded = false
                        onSelect(month)
                    }
                )
            }
        }
    }
}

@Composable
private fun RecurrenceSelector(
    selected: RecurrenceType,
    onSelect: (RecurrenceType) -> Unit
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        RecurrenceType.entries.forEach { type ->
            FilterChip(
                selected = selected == type,
                onClick = { onSelect(type) },
                label = {
                    Text(
                        when (type) {
                            RecurrenceType.EVENTUAL -> "Eventual"
                            RecurrenceType.FIXO -> "Fixo"
                            RecurrenceType.PARCELADO -> "Parcelado"
                        }
                    )
                }
            )
        }
    }
}

private fun tabIcon(tab: MainTab): ImageVector {
    return when (tab) {
        MainTab.Dashboard -> Icons.Filled.Home
        MainTab.Receitas -> Icons.Filled.CheckCircle
        MainTab.Despesas -> Icons.Filled.ShoppingCart
        MainTab.Cartoes -> CreditCardIcon
        MainTab.Mais -> Icons.Filled.MoreVert
    }
}

private val CreditCardIcon: ImageVector = ImageVector.Builder(
    name = "CreditCard",
    defaultWidth = 24.dp,
    defaultHeight = 24.dp,
    viewportWidth = 24f,
    viewportHeight = 24f
).apply {
    path(
        fill = SolidColor(Color.Black),
        stroke = null,
        strokeLineWidth = 1f,
        strokeLineCap = StrokeCap.Butt,
        strokeLineJoin = StrokeJoin.Miter,
        strokeLineMiter = 4f
    ) {
        moveTo(20f, 4f)
        horizontalLineTo(4f)
        curveTo(2.89f, 4f, 2.01f, 4.89f, 2.01f, 6f)
        lineTo(2f, 18f)
        curveTo(2f, 19.11f, 2.89f, 20f, 4f, 20f)
        horizontalLineTo(20f)
        curveTo(21.11f, 20f, 22f, 19.11f, 22f, 18f)
        verticalLineTo(6f)
        curveTo(22f, 4.89f, 21.11f, 4f, 20f, 4f)
        close()
        moveTo(20f, 18f)
        horizontalLineTo(4f)
        verticalLineTo(12f)
        horizontalLineTo(20f)
        verticalLineTo(18f)
        close()
        moveTo(20f, 8f)
        horizontalLineTo(4f)
        verticalLineTo(6f)
        horizontalLineTo(20f)
        verticalLineTo(8f)
        close()
    }
}.build()

private fun moreSectionLabel(section: MoreSection): String {
    return when (section) {
        MoreSection.Menu -> "Mais"
        MoreSection.Relatorios -> "Relatórios"
        MoreSection.Configuracoes -> "Configurações"
    }
}

private fun recurrenceLabel(type: RecurrenceType): String {
    return when (type) {
        RecurrenceType.EVENTUAL -> "Eventual"
        RecurrenceType.FIXO -> "Fixo"
        RecurrenceType.PARCELADO -> "Parcelado"
    }
}

private fun calculateTotals(
    revenues: List<RevenueItem>,
    expenses: List<ExpenseItem>,
    initialBalanceCents: Long
): FinanceTotals {
    return FinanceTotals(
        saldoInicial = initialBalanceCents,
        totalReceitas = revenues.sumOf { it.amountCents },
        totalRecebido = revenues
            .filter { it.status.equals("Recebido", ignoreCase = true) }
            .sumOf { it.amountCents },
        totalDespesas = expenses.sumOf { it.amountCents },
        totalPago = expenses
            .filter { it.status.equals("Pago", ignoreCase = true) }
            .sumOf { it.amountCents }
    )
}

private fun buildTimeline(
    revenues: List<RevenueItem>,
    expenses: List<ExpenseItem>
): List<TimelineItem> {
    val revenueItems = revenues.map {
        TimelineItem(
            id = "r-${it.id}",
            title = it.description,
            category = it.categoryName ?: "Sem categoria",
            amountCents = it.amountCents,
            status = it.status,
            isIncome = true
        )
    }
    val expenseItems = expenses.map {
        TimelineItem(
            id = "d-${it.id}",
            title = it.description,
            category = it.categoryName ?: "Sem categoria",
            amountCents = it.amountCents,
            status = it.status,
            isIncome = false
        )
    }
    return (revenueItems + expenseItems).sortedByDescending { it.id }
}

private fun selectedBudgetMonths(uiState: FinanceUiState): List<Int> {
    return uiState.budgets.firstOrNull { it.id == uiState.selectedBudgetId }?.months
        ?.ifEmpty { (1..12).toList() }
        ?: (1..12).toList()
}

private fun currentMonth(allowedMonths: List<Int>): Int {
    val month = Calendar.getInstance().get(Calendar.MONTH) + 1
    return if (month in allowedMonths) month else allowedMonths.firstOrNull() ?: 1
}

private fun monthName(month: Int): String {
    return when (month) {
        1 -> "Janeiro"
        2 -> "Fevereiro"
        3 -> "Março"
        4 -> "Abril"
        5 -> "Maio"
        6 -> "Junho"
        7 -> "Julho"
        8 -> "Agosto"
        9 -> "Setembro"
        10 -> "Outubro"
        11 -> "Novembro"
        12 -> "Dezembro"
        else -> "Mês $month"
    }
}

private fun sanitizeCurrencyInput(input: String): String {
    val trimmed = input
        .removePrefix("R$")
        .trim()
        .filter { it.isDigit() || it == ',' || it == '.' }
    val separatorIndex = trimmed.indexOfFirst { it == ',' || it == '.' }
    if (separatorIndex < 0) {
        val integerPart = trimmed.filter(Char::isDigit).take(9)
        return if (integerPart.isEmpty()) "" else "$integerPart,00"
    }

    val integerPart = trimmed
        .take(separatorIndex)
        .filter(Char::isDigit)
        .take(9)
        .ifEmpty { "0" }
    val decimalPart = trimmed
        .drop(separatorIndex + 1)
        .filter(Char::isDigit)
        .take(2)
        .padEnd(2, '0')

    return "$integerPart,$decimalPart"
}

private fun currencyCursorPosition(text: String): Int {
    val commaIndex = text.indexOf(',')
    return if (commaIndex >= 0) commaIndex else text.length
}

private fun formatAmountForInput(amountCents: Long): String {
    val reais = amountCents / 100L
    val centavos = amountCents % 100L
    return String.format(Locale("pt", "BR"), "%d,%02d", reais, centavos)
}

private fun formatDateBr(dateIso: String): String {
    val parts = dateIso.split("-")
    if (parts.size != 3) return ""
    return "${parts[2]}/${parts[1]}/${parts[0]}"
}

private fun todayUtcMillis(): Long {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    return calendar.timeInMillis
}

private fun isoDateFromUtcMillis(millis: Long): String {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
        timeInMillis = millis
    }
    return "%04d-%02d-%02d".format(
        Locale.US,
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH) + 1,
        calendar.get(Calendar.DAY_OF_MONTH)
    )
}

private fun formatMoney(amountCents: Long): String {
    val formatter = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    return formatter.format(amountCents.toDouble() / 100.0)
}

private fun formatCompactMoney(amountCents: Long): String {
    val value = amountCents.toDouble() / 100.0
    val formatter = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).apply {
        maximumFractionDigits = 0
        minimumFractionDigits = 0
    }
    return formatter.format(value)
}
