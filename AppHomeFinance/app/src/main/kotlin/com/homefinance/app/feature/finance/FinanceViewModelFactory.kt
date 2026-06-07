package com.homefinance.app.feature.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.homefinance.app.data.repository.FinanceRepository

class FinanceViewModelFactory(
    private val financeRepository: FinanceRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(FinanceViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return FinanceViewModel(financeRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
