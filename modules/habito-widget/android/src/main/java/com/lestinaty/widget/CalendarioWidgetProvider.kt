package com.lestinaty.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import androidx.core.content.ContextCompat
import org.json.JSONArray
import java.util.Calendar
import java.util.Locale

/**
 * Widget de calendario mensual — vista de mes, todos los hábitos combinados:
 * un punto verde en cada día donde se cumplió al menos un hábito. Usa una
 * grilla fija de 6x7 celdas (42 TextViews declarados en el XML) en vez de un
 * RemoteViewsService/GridView dinámico, evitando esa complejidad ya que un
 * mes nunca necesita más de 6 filas.
 */
class CalendarioWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        for (appWidgetId in appWidgetIds) {
            appWidgetManager.updateAppWidget(appWidgetId, construirRemoteViews(context))
        }
    }

    companion object {
        const val PREFS_NAME = "LestinatyCalendarioWidgetPrefs"
        const val KEY_ANIO = "anio"
        const val KEY_MES = "mes"
        const val KEY_DIAS_COMPLETADOS = "dias_completados"

        private val NOMBRES_MES = arrayOf(
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        )

        private val IDS_DIA_MES = intArrayOf(
            R.id.widget_mes_dia_0, R.id.widget_mes_dia_1, R.id.widget_mes_dia_2, R.id.widget_mes_dia_3, R.id.widget_mes_dia_4, R.id.widget_mes_dia_5, R.id.widget_mes_dia_6,
            R.id.widget_mes_dia_7, R.id.widget_mes_dia_8, R.id.widget_mes_dia_9, R.id.widget_mes_dia_10, R.id.widget_mes_dia_11, R.id.widget_mes_dia_12, R.id.widget_mes_dia_13,
            R.id.widget_mes_dia_14, R.id.widget_mes_dia_15, R.id.widget_mes_dia_16, R.id.widget_mes_dia_17, R.id.widget_mes_dia_18, R.id.widget_mes_dia_19, R.id.widget_mes_dia_20,
            R.id.widget_mes_dia_21, R.id.widget_mes_dia_22, R.id.widget_mes_dia_23, R.id.widget_mes_dia_24, R.id.widget_mes_dia_25, R.id.widget_mes_dia_26, R.id.widget_mes_dia_27,
            R.id.widget_mes_dia_28, R.id.widget_mes_dia_29, R.id.widget_mes_dia_30, R.id.widget_mes_dia_31, R.id.widget_mes_dia_32, R.id.widget_mes_dia_33, R.id.widget_mes_dia_34,
            R.id.widget_mes_dia_35, R.id.widget_mes_dia_36, R.id.widget_mes_dia_37, R.id.widget_mes_dia_38, R.id.widget_mes_dia_39, R.id.widget_mes_dia_40, R.id.widget_mes_dia_41
        )

        fun actualizarTodosLosWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, CalendarioWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            val views = construirRemoteViews(context)
            for (id in appWidgetIds) {
                appWidgetManager.updateAppWidget(id, views)
            }
        }

        private fun jsonAListaInt(raw: String?): List<Int> {
            if (raw.isNullOrEmpty()) return emptyList()
            return try {
                val arr = JSONArray(raw)
                (0 until arr.length()).map { arr.getInt(it) }
            } catch (_: Exception) {
                emptyList()
            }
        }

        fun construirRemoteViews(context: Context): RemoteViews {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val views = RemoteViews(context.packageName, R.layout.widget_calendario_mes)

            val hoy = Calendar.getInstance()
            val anio = prefs.getInt(KEY_ANIO, hoy.get(Calendar.YEAR))
            val mes = prefs.getInt(KEY_MES, hoy.get(Calendar.MONTH) + 1) // 1-12
            val diasCompletados = jsonAListaInt(prefs.getString(KEY_DIAS_COMPLETADOS, "[]"))

            val nombreMes = NOMBRES_MES.getOrElse(mes - 1) { "" }
            views.setTextViewText(R.id.widget_calendario_titulo, "$nombreMes $anio".trim())

            val calendarioMes = Calendar.getInstance(Locale.getDefault()).apply {
                clear()
                set(anio, mes - 1, 1)
            }
            // Lunes(0)..domingo(6) — mismo criterio que el widget de hábito.
            val offsetPrimerDia = (calendarioMes.get(Calendar.DAY_OF_WEEK) + 5) % 7
            val totalDias = calendarioMes.getActualMaximum(Calendar.DAY_OF_MONTH)

            val esMesActual = anio == hoy.get(Calendar.YEAR) && mes == hoy.get(Calendar.MONTH) + 1
            val diaHoy = hoy.get(Calendar.DAY_OF_MONTH)

            for (indice in 0 until 42) {
                val viewId = IDS_DIA_MES[indice]
                val numeroDia = indice - offsetPrimerDia + 1

                if (numeroDia < 1 || numeroDia > totalDias) {
                    views.setTextViewText(viewId, "")
                    views.setInt(viewId, "setBackgroundResource", 0)
                    views.setViewVisibility(viewId, View.INVISIBLE)
                    continue
                }

                views.setViewVisibility(viewId, View.VISIBLE)
                views.setTextViewText(viewId, numeroDia.toString())

                val completado = diasCompletados.contains(numeroDia)
                val esHoy = esMesActual && numeroDia == diaHoy

                when {
                    completado -> {
                        views.setInt(viewId, "setBackgroundResource", R.drawable.widget_mes_dia_completado)
                        views.setTextColor(viewId, ContextCompat.getColor(context, R.color.widget_dia_texto_claro))
                    }
                    esHoy -> {
                        views.setInt(viewId, "setBackgroundResource", R.drawable.widget_mes_dia_hoy)
                        views.setTextColor(viewId, ContextCompat.getColor(context, R.color.widget_mes_dia_texto))
                    }
                    else -> {
                        views.setInt(viewId, "setBackgroundResource", 0)
                        views.setTextColor(viewId, ContextCompat.getColor(context, R.color.widget_mes_dia_texto))
                    }
                }
            }

            return views
        }
    }
}
