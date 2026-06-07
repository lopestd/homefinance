package com.homefinance.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.homefinance.app.feature.auth.AuthViewModel
import com.homefinance.app.feature.finance.FinanceViewModel
import com.homefinance.app.navigation.AppNavHost

@Composable
fun HomeFinanceApp(
    authViewModel: AuthViewModel,
    financeViewModel: FinanceViewModel
) {
    val authUiState by authViewModel.uiState.collectAsState()

    AppNavHost(
        authUiState = authUiState,
        onCreateAccount = authViewModel::createAccount,
        onLogin = authViewModel::login,
        onLogout = authViewModel::logout,
        financeViewModel = financeViewModel
    )
}
