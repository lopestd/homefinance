package com.homefinance.app.navigation

import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.homefinance.app.feature.auth.AuthUiState
import com.homefinance.app.feature.backup.BackupUiState
import com.homefinance.app.feature.auth.CreateAccountScreen
import com.homefinance.app.feature.auth.LoginScreen
import com.homefinance.app.feature.finance.FinanceViewModel
import com.homefinance.app.feature.home.HomeScreen

@Composable
fun AppNavHost(
    authUiState: AuthUiState,
    backupUiState: BackupUiState,
    onCreateProfile: (name: String, email: String) -> Unit,
    onSelectProfile: (Long) -> Unit,
    onLogout: () -> Unit,
    onExportBackup: (Uri) -> Unit,
    onRestoreBackup: (Uri) -> Unit,
    onClearBackupMessage: () -> Unit,
    financeViewModel: FinanceViewModel,
    navController: NavHostController = rememberNavController()
) {
    if (authUiState.isLoading) {
        LoadingScreen()
        return
    }

    val startRoute = if (authUiState.hasLocalAccount) {
        AppRoute.Login.route
    } else {
        AppRoute.CreateAccount.route
    }

    LaunchedEffect(authUiState.isAuthenticated, authUiState.hasLocalAccount) {
        if (authUiState.isAuthenticated) {
            navController.navigate(AppRoute.Home.route) {
                launchSingleTop = true
                popUpTo(AppRoute.Login.route) {
                    inclusive = true
                }
            }
            return@LaunchedEffect
        }

        if (authUiState.hasLocalAccount) {
            navController.navigate(AppRoute.Login.route) {
                launchSingleTop = true
                popUpTo(AppRoute.Home.route) {
                    inclusive = true
                }
            }
        } else {
            navController.navigate(AppRoute.CreateAccount.route) {
                launchSingleTop = true
                popUpTo(AppRoute.Home.route) {
                    inclusive = true
                }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startRoute
    ) {
        composable(AppRoute.CreateAccount.route) {
            CreateAccountScreen(
                state = authUiState,
                onCreateProfile = onCreateProfile,
                onNavigateToLogin = {
                    navController.navigate(AppRoute.Login.route) {
                        launchSingleTop = true
                    }
                }
            )
        }
        composable(AppRoute.Login.route) {
            LoginScreen(
                state = authUiState,
                onSelectProfile = onSelectProfile,
                onNavigateToCreateAccount = {
                    navController.navigate(AppRoute.CreateAccount.route) {
                        launchSingleTop = true
                    }
                }
            )
        }
        composable(AppRoute.Home.route) {
            val financeUiState by financeViewModel.uiState.collectAsState()
            val userId = authUiState.userId

            LaunchedEffect(userId) {
                if (userId != null) {
                    financeViewModel.loadForUser(userId)
                }
            }

            HomeScreen(
                accountName = authUiState.accountName.ifBlank { "Usuário" },
                uiState = financeUiState,
                backupUiState = backupUiState,
                onLogout = onLogout,
                onExportBackup = onExportBackup,
                onRestoreBackup = onRestoreBackup,
                onClearBackupMessage = onClearBackupMessage,
                onSelectBudget = financeViewModel::selectBudget,
                onCreateBudget = financeViewModel::createBudget,
                onUpdateBudget = financeViewModel::updateBudget,
                onCreateCategory = financeViewModel::createCategory,
                onUpdateCategory = financeViewModel::updateCategory,
                onCreateRevenue = financeViewModel::createRevenue,
                onCreateExpense = financeViewModel::createExpense,
                onUpdateInitialBalance = financeViewModel::updateInitialBalance,
                onCreatePredefinedExpense = financeViewModel::createPredefinedExpense,
                onUpdatePredefinedExpense = financeViewModel::updatePredefinedExpense,
                onCreatePredefinedRevenue = financeViewModel::createPredefinedRevenue,
                onUpdatePredefinedRevenue = financeViewModel::updatePredefinedRevenue,
                onCreateCard = financeViewModel::createCard,
                onUpdateCard = financeViewModel::updateCard,
                onSetCardLimit = financeViewModel::setCardLimit,
                onCreateCardCharge = financeViewModel::createCardCharge,
                onUpdateRevenue = financeViewModel::updateRevenue,
                onUpdateExpense = financeViewModel::updateExpense,
                onUpdateCardCharge = financeViewModel::updateCardCharge,
                onCloseCardInvoice = financeViewModel::closeCardInvoice,
                onReopenCardInvoice = financeViewModel::reopenCardInvoice,
                onDeleteCardCharge = financeViewModel::deleteCardCharge,
                onToggleRevenueStatus = financeViewModel::toggleRevenueStatus,
                onToggleExpenseStatus = financeViewModel::toggleExpenseStatus,
                onDeleteRevenue = financeViewModel::deleteRevenue,
                onDeleteExpense = financeViewModel::deleteExpense,
                onClearMessage = financeViewModel::clearMessage
            )
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}
