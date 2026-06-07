package com.homefinance.app.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.homefinance.app.core.model.BudgetItem
import com.homefinance.app.core.model.CategoryItem
import com.homefinance.app.core.model.CategoryType
import com.homefinance.app.core.model.ExpenseItem
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
import java.util.Locale
import kotlin.math.roundToInt

private enum class MainTab(val label: String) {
    Dashboard("Dashboard"),
    Receitas("Receitas"),
    Despesas("Despesas"),
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
    Closed("Concluidas")
}

private data class FinanceTotals(
    val totalReceitas: Long,
    val totalRecebido: Long,
    val totalDespesas: Long,
    val totalPago: Long
) {
    val saldoAtual: Long = totalRecebido - totalPago
    val saldoPrevisto: Long = totalReceitas - totalDespesas
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

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun HomeScreen(
    accountName: String,
    uiState: FinanceUiState,
    onLogout: () -> Unit,
    onSelectBudget: (Long?) -> Unit,
    onCreateBudget: (String) -> Unit,
    onCreateCategory: (String, CategoryType) -> Unit,
    onCreateRevenue: (String, String, Long?) -> Unit,
    onCreateExpense: (String, String, Long?) -> Unit,
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

    var revenueSheetOpen by rememberSaveable { mutableStateOf(false) }
    var expenseSheetOpen by rememberSaveable { mutableStateOf(false) }
    var budgetSheetOpen by rememberSaveable { mutableStateOf(false) }
    var categorySheetOpen by rememberSaveable { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }
    val totals = remember(uiState.revenues, uiState.expenses) {
        calculateTotals(uiState.revenues, uiState.expenses)
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
                }
            },
            snackbarHost = { SnackbarHost(snackbarHostState) }
        ) { padding ->
            when (selectedTab) {
                MainTab.Dashboard -> DashboardScreen(
                    padding = padding,
                    uiState = uiState,
                    totals = totals,
                    onSelectBudget = onSelectBudget
                )
                MainTab.Receitas -> RevenuesScreen(
                    padding = padding,
                    uiState = uiState,
                    totals = totals,
                    onSelectBudget = onSelectBudget,
                    onToggleRevenueStatus = onToggleRevenueStatus,
                    onDeleteRevenue = onDeleteRevenue
                )
                MainTab.Despesas -> ExpensesScreen(
                    padding = padding,
                    uiState = uiState,
                    totals = totals,
                    onSelectBudget = onSelectBudget,
                    onToggleExpenseStatus = onToggleExpenseStatus,
                    onDeleteExpense = onDeleteExpense
                )
                MainTab.Mais -> MoreScreen(
                    padding = padding,
                    section = moreSection,
                    uiState = uiState,
                    totals = totals,
                    onOpenRelatorios = { moreSectionName = MoreSection.Relatorios.name },
                    onOpenConfiguracoes = { moreSectionName = MoreSection.Configuracoes.name },
                    onOpenBudgetSheet = { budgetSheetOpen = true },
                    onOpenCategorySheet = { categorySheetOpen = true }
                )
            }
        }
    }

    if (revenueSheetOpen) {
        EntrySheet(
            title = "Nova receita",
            categories = uiState.categoriesRevenue,
            saveLabel = "Salvar receita",
            onDismiss = { revenueSheetOpen = false },
            onSave = { description, amount, categoryId ->
                onCreateRevenue(description, amount, categoryId)
                revenueSheetOpen = false
            }
        )
    }

    if (expenseSheetOpen) {
        EntrySheet(
            title = "Nova despesa",
            categories = uiState.categoriesExpense,
            saveLabel = "Salvar despesa",
            onDismiss = { expenseSheetOpen = false },
            onSave = { description, amount, categoryId ->
                onCreateExpense(description, amount, categoryId)
                expenseSheetOpen = false
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

    if (categorySheetOpen) {
        CategorySheet(
            onDismiss = { categorySheetOpen = false },
            onSave = { name, type ->
                onCreateCategory(name, type)
                categorySheetOpen = false
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
                label = { Text(tab.label) }
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
    totals: FinanceTotals,
    onSelectBudget: (Long?) -> Unit
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
                onSelectBudget = onSelectBudget
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
    onSelectBudget: (Long?) -> Unit,
    onToggleRevenueStatus: (Long) -> Unit,
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
            BudgetContextCard(
                budgets = uiState.budgets,
                selectedBudgetId = uiState.selectedBudgetId,
                onSelectBudget = onSelectBudget
            )
        }
        item {
            SectionSummaryCard(
                title = "Receitas",
                primaryLabel = "Recebido",
                primaryValue = totals.totalRecebido,
                secondaryLabel = "Lancado",
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
    onSelectBudget: (Long?) -> Unit,
    onToggleExpenseStatus: (Long) -> Unit,
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
            BudgetContextCard(
                budgets = uiState.budgets,
                selectedBudgetId = uiState.selectedBudgetId,
                onSelectBudget = onSelectBudget
            )
        }
        item {
            SectionSummaryCard(
                title = "Despesas",
                primaryLabel = "Pago",
                primaryValue = totals.totalPago,
                secondaryLabel = "Lancado",
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
                    onDelete = onDeleteExpense
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
    onOpenCategorySheet: () -> Unit
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
            onOpenCategorySheet = onOpenCategorySheet
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
                title = "Relatorios",
                subtitle = "Totais por categoria e consolidado do orcamento",
                icon = Icons.AutoMirrored.Filled.List,
                onClick = onOpenRelatorios
            )
        }
        item {
            MoreActionCard(
                title = "Configuracoes",
                subtitle = "Orcamentos e categorias locais",
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
    }
}

@Composable
private fun SettingsScreen(
    padding: PaddingValues,
    uiState: FinanceUiState,
    onOpenBudgetSheet: () -> Unit,
    onOpenCategorySheet: () -> Unit
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
                title = "Orcamentos",
                actionLabel = "Novo orcamento",
                onAction = onOpenBudgetSheet
            ) {
                if (uiState.budgets.isEmpty()) {
                    Text("Nenhum orcamento cadastrado.", color = HfMuted)
                } else {
                    uiState.budgets.forEach { budget ->
                        SettingsLine(
                            title = "Ano ${budget.year}",
                            detail = if (budget.isActive) "Ativo" else "Inativo"
                        )
                    }
                }
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
                            detail = category.type.name
                        )
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
    onSelectBudget: (Long?) -> Unit
) {
    ElevatedPanel {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Contexto financeiro",
                    style = MaterialTheme.typography.bodySmall,
                    color = HfMuted
                )
                Spacer(Modifier.height(4.dp))
                BudgetDropdown(
                    budgets = budgets,
                    selectedBudgetId = selectedBudgetId,
                    onSelectBudget = onSelectBudget
                )
            }
            Spacer(Modifier.width(10.dp))
            StatusBadge(
                text = "Local",
                color = HfTeal
            )
        }
    }
}

@Composable
private fun BudgetDropdown(
    budgets: List<BudgetItem>,
    selectedBudgetId: Long?,
    onSelectBudget: (Long?) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val selected = budgets.firstOrNull { it.id == selectedBudgetId }
    val label = selected?.let { "Orcamento ${it.year}" } ?: "Selecionar orcamento"

    Box {
        Row(
            modifier = Modifier
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
                color = HfText
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
                    text = { Text("Orcamento ${budget.year}") },
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
                text = "Execucao do orcamento",
                style = MaterialTheme.typography.titleMedium,
                color = HfText
            )
            ProgressBlock(
                title = "Receitas",
                realized = totals.totalRecebido,
                planned = totals.totalReceitas,
                remainingLabel = "Falta receber",
                remaining = totals.pendenteReceita,
                tone = HfGreen
            )
            ProgressBlock(
                title = "Despesas",
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
            Text("Realizado ${formatMoney(realized)}", style = MaterialTheme.typography.bodySmall, color = HfMuted)
            Text("$remainingLabel ${formatMoney(remaining)}", style = MaterialTheme.typography.bodySmall, color = HfMuted)
        }
    }
}

@Composable
private fun TimelineCard(items: List<TimelineItem>) {
    ElevatedPanel {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "Ultimos lancamentos",
                style = MaterialTheme.typography.titleMedium,
                color = HfText
            )
            if (items.isEmpty()) {
                EmptyInline("Nenhum lancamento cadastrado.")
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
        onDelete = { onDelete(revenue.id) }
    )
}

@Composable
private fun ExpenseRow(
    expense: ExpenseItem,
    onToggleStatus: (Long) -> Unit,
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
                EmptyInline("Sem dados para este orcamento.")
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
    detail: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(title, style = MaterialTheme.typography.bodyMedium, color = HfText)
        Text(detail, style = MaterialTheme.typography.bodySmall, color = HfMuted)
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
@OptIn(ExperimentalMaterial3Api::class)
private fun EntrySheet(
    title: String,
    categories: List<CategoryItem>,
    saveLabel: String,
    onDismiss: () -> Unit,
    onSave: (description: String, amount: String, categoryId: Long?) -> Unit
) {
    var description by rememberSaveable { mutableStateOf("") }
    var amount by rememberSaveable { mutableStateOf("") }
    var selectedCategoryId by rememberSaveable { mutableStateOf<Long?>(null) }
    val canSave = description.isNotBlank() && amount.isNotBlank()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = title) {
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Descricao") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Valor") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            CategoryDropdown(
                categories = categories,
                selectedId = selectedCategoryId,
                fallbackLabel = "Sem categoria",
                onSelect = { selectedCategoryId = it }
            )
            Button(
                onClick = { onSave(description, amount, selectedCategoryId) },
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
    onDismiss: () -> Unit,
    onSave: (String) -> Unit
) {
    var year by rememberSaveable { mutableStateOf("") }
    val canSave = year.length == 4

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = "Novo orcamento") {
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
                Text("Salvar orcamento")
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun CategorySheet(
    onDismiss: () -> Unit,
    onSave: (String, CategoryType) -> Unit
) {
    var name by rememberSaveable { mutableStateOf("") }
    var typeName by rememberSaveable { mutableStateOf(CategoryType.DESPESA.name) }
    val canSave = name.isNotBlank()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = HfSurface
    ) {
        SheetContent(title = "Nova categoria") {
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
                Text("Salvar categoria")
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
            .padding(horizontal = 18.dp, vertical = 8.dp)
            .padding(bottom = 20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = HfText)
        content()
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

private fun tabIcon(tab: MainTab): ImageVector {
    return when (tab) {
        MainTab.Dashboard -> Icons.Filled.Home
        MainTab.Receitas -> Icons.Filled.CheckCircle
        MainTab.Despesas -> Icons.Filled.ShoppingCart
        MainTab.Mais -> Icons.Filled.MoreVert
    }
}

private fun moreSectionLabel(section: MoreSection): String {
    return when (section) {
        MoreSection.Menu -> "Mais"
        MoreSection.Relatorios -> "Relatorios"
        MoreSection.Configuracoes -> "Configuracoes"
    }
}

private fun calculateTotals(
    revenues: List<RevenueItem>,
    expenses: List<ExpenseItem>
): FinanceTotals {
    return FinanceTotals(
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
