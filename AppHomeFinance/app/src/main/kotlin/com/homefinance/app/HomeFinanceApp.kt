package com.homefinance.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.homefinance.app.feature.auth.AuthViewModel
import com.homefinance.app.feature.backup.BackupViewModel
import com.homefinance.app.feature.finance.FinanceViewModel
import com.homefinance.app.navigation.AppNavHost

@Composable
fun HomeFinanceApp(
    authViewModel: AuthViewModel,
    financeViewModel: FinanceViewModel,
    backupViewModel: BackupViewModel
) {
    val authUiState by authViewModel.uiState.collectAsState()
    val backupUiState by backupViewModel.uiState.collectAsState()

    LaunchedEffect(backupUiState.restoreCompletedVersion) {
        if (backupUiState.restoreCompletedVersion > 0) {
            financeViewModel.resetAfterRestore()
            authViewModel.handleRestoreCompleted()
            backupViewModel.clearMessage()
        }
    }

    AppNavHost(
        authUiState = authUiState,
        backupUiState = backupUiState,
        onCreateProfile = authViewModel::createProfile,
        onSelectProfile = authViewModel::selectProfile,
        onLogout = authViewModel::logout,
        onExportBackup = backupViewModel::exportBackup,
        onRestoreBackup = backupViewModel::restoreBackup,
        onClearBackupMessage = backupViewModel::clearMessage,
        financeViewModel = financeViewModel
    )
}
