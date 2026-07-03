package com.homefinance.app.feature.backup

data class BackupUiState(
    val isRunning: Boolean = false,
    val message: String? = null,
    val restoreCompletedVersion: Int = 0
)
