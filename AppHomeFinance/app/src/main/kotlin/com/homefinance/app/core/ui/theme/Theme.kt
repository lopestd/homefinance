package com.homefinance.app.core.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp

private val LightColors = lightColorScheme(
    primary = HfBlue,
    onPrimary = HfSurface,
    secondary = HfTeal,
    tertiary = HfAmber,
    background = HfPage,
    onBackground = HfText,
    surface = HfSurface,
    onSurface = HfText,
    surfaceVariant = HfSurfaceMuted,
    onSurfaceVariant = HfMuted,
    outline = HfBorder,
    error = HfRed
)

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(6.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(10.dp),
    large = RoundedCornerShape(12.dp),
    extraLarge = RoundedCornerShape(16.dp)
)

@Composable
fun HomeFinanceTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}
