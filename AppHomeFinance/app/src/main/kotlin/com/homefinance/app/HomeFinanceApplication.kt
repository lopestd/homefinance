package com.homefinance.app

import android.app.Application
import com.homefinance.app.data.local.HomeFinanceDatabase

class HomeFinanceApplication : Application() {
    val database: HomeFinanceDatabase by lazy {
        HomeFinanceDatabase.build(applicationContext)
    }
}
