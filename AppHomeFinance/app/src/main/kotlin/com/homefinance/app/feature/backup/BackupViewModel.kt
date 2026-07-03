package com.homefinance.app.feature.backup

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homefinance.app.data.repository.BackupRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class BackupViewModel(
    private val backupRepository: BackupRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(BackupUiState())
    val uiState: StateFlow<BackupUiState> = _uiState.asStateFlow()

    fun exportBackup(destination: Uri) {
        viewModelScope.launch(Dispatchers.IO) {
            _uiState.update { it.copy(isRunning = true, message = null) }
            val result = backupRepository.exportBackup(destination)
            _uiState.update {
                it.copy(
                    isRunning = false,
                    message = result.exceptionOrNull()?.message ?: "Backup gerado."
                )
            }
        }
    }

    fun restoreBackup(source: Uri) {
        viewModelScope.launch(Dispatchers.IO) {
            _uiState.update { it.copy(isRunning = true, message = null) }
            val result = backupRepository.restoreBackup(source)
            _uiState.update {
                if (result.isSuccess) {
                    it.copy(
                        isRunning = false,
                        message = "Backup restaurado. Selecione um perfil.",
                        restoreCompletedVersion = it.restoreCompletedVersion + 1
                    )
                } else {
                    it.copy(
                        isRunning = false,
                        message = result.exceptionOrNull()?.message ?: "Falha ao restaurar backup."
                    )
                }
            }
        }
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null) }
    }
}
