package com.homefinance.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.homefinance.app.core.ui.theme.HomeFinanceTheme
import com.homefinance.app.data.repository.RoomBackupRepository
import com.homefinance.app.data.repository.RoomAuthRepository
import com.homefinance.app.data.repository.RoomFinanceRepository
import com.homefinance.app.domain.usecase.BootstrapAuthStateUseCase
import com.homefinance.app.domain.usecase.CreateLocalAccountUseCase
import com.homefinance.app.domain.usecase.LoginLocalUseCase
import com.homefinance.app.domain.usecase.LogoutLocalUseCase
import com.homefinance.app.feature.auth.AuthViewModel
import com.homefinance.app.feature.auth.AuthViewModelFactory
import com.homefinance.app.feature.backup.BackupViewModel
import com.homefinance.app.feature.backup.BackupViewModelFactory
import com.homefinance.app.feature.finance.FinanceViewModel
import com.homefinance.app.feature.finance.FinanceViewModelFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val database = (application as HomeFinanceApplication).database

        setContent {
            HomeFinanceTheme {
                val authRepository = remember { RoomAuthRepository(database) }
                val financeRepository = remember { RoomFinanceRepository(database) }
                val backupRepository = remember { RoomBackupRepository(applicationContext, database) }
                val bootstrapAuthStateUseCase = remember { BootstrapAuthStateUseCase(authRepository) }
                val createAccountUseCase = remember { CreateLocalAccountUseCase(authRepository) }
                val loginUseCase = remember { LoginLocalUseCase(authRepository) }
                val logoutUseCase = remember { LogoutLocalUseCase(authRepository) }

                val authViewModel: AuthViewModel = viewModel(
                    factory = AuthViewModelFactory(
                        bootstrapAuthStateUseCase = bootstrapAuthStateUseCase,
                        createAccountUseCase = createAccountUseCase,
                        loginUseCase = loginUseCase,
                        logoutUseCase = logoutUseCase
                    )
                )
                val financeViewModel: FinanceViewModel = viewModel(
                    factory = FinanceViewModelFactory(financeRepository)
                )
                val backupViewModel: BackupViewModel = viewModel(
                    factory = BackupViewModelFactory(backupRepository)
                )

                Surface(modifier = Modifier.fillMaxSize()) {
                    HomeFinanceApp(
                        authViewModel = authViewModel,
                        financeViewModel = financeViewModel,
                        backupViewModel = backupViewModel
                    )
                }
            }
        }
    }
}
