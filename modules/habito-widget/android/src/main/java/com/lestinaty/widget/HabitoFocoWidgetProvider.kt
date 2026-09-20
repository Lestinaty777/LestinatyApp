package com.lestinaty.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.view.View
import android.widget.RemoteViews
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class HabitoFocoWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        for (appWidgetId in appWidgetIds) {
            val views = construirRemoteViews(context)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        if (intent.action == ACTION_INCREMENTAR) {
            manejarIncremento(context)
            actualizarTodosLosWidgets(context)
        }
    }

    companion object {
        const val PREFS_NAME = "LestinatyHabitoWidgetPrefs"
        const val ACTION_INCREMENTAR = "com.lestinaty.widget.ACTION_INCREMENTAR"

        // Claves SharedPreferences
        const val KEY_HABITO_ID = "habito_id"
        const val KEY_TITULO = "titulo"
        const val KEY_COLOR = "color"
        const val KEY_ACTUAL = "actual"
        const val KEY_META = "meta"
        const val KEY_UNIDAD = "unidad"
        const val KEY_COMPLETADO = "completado"
        const val KEY_RACHA = "racha"
        const val KEY_ES_PRO = "es_pro"
        const val KEY_TIPO_META = "tipo_meta"
        const val KEY_INCREMENTOS_PENDIENTES = "incrementos_pendientes"
        const val KEY_NIVEL = "nivel"
        const val KEY_IMAGEN_ETAPA = "imagen_etapa_recurso"
        const val KEY_DIAS_PROGRAMADOS = "dias_programados"
        const val KEY_DIAS_COMPLETADOS = "dias_completados_semana"

        // Ids de las 7 celdas del calendario semanal, lunes(1)..domingo(7) —
        // mismo orden/convención que HabitoHoyDetalle en el lado JS.
        private val IDS_DIA_SEMANA = intArrayOf(
            R.id.widget_dia_1, R.id.widget_dia_2, R.id.widget_dia_3, R.id.widget_dia_4,
            R.id.widget_dia_5, R.id.widget_dia_6, R.id.widget_dia_7
        )

        private fun jsonAListaInt(raw: String?): List<Int> {
            if (raw.isNullOrEmpty()) return emptyList()
            return try {
                val arr = JSONArray(raw)
                (0 until arr.length()).map { arr.getInt(it) }
            } catch (_: Exception) {
                emptyList()
            }
        }

        fun actualizarTodosLosWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, HabitoFocoWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            val views = construirRemoteViews(context)
            for (id in appWidgetIds) {
                appWidgetManager.updateAppWidget(id, views)
            }
        }

        private fun manejarIncremento(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val esPro = prefs.getBoolean(KEY_ES_PRO, true)
            if (!esPro) return

            val habitoId = prefs.getString(KEY_HABITO_ID, null) ?: return
            val completado = prefs.getBoolean(KEY_COMPLETADO, false)
            if (completado) return

            val meta = prefs.getInt(KEY_META, 1)
            val actual = prefs.getInt(KEY_ACTUAL, 0)
            val tipoMeta = prefs.getString(KEY_TIPO_META, "cantidad")

            val nuevoValor = if (tipoMeta == "check") {
                meta
            } else {
                val paso = if (meta >= 10) max(1, (meta / 8.0).roundToInt()) else 1
                min(meta, actual + paso)
            }

            val nuevoCompletado = nuevoValor >= meta

            // Guardar progreso actualizado de forma instantánea
            prefs.edit()
                .putInt(KEY_ACTUAL, nuevoValor)
                .putBoolean(KEY_COMPLETADO, nuevoCompletado)
                .apply()

            // Registrar incremento en la cola de sincronización para Supabase
            encolarIncrementoParaSupabase(context, habitoId, nuevoValor)

            // Notificar al módulo si React Native está activo
            HabitoWidgetModule.emitirIncremento(habitoId, nuevoValor)
        }

        private fun encolarIncrementoParaSupabase(context: Context, habitoId: String, valor: Int) {
            try {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val raw = prefs.getString(KEY_INCREMENTOS_PENDIENTES, "[]") ?: "[]"
                val lista = JSONArray(raw)

                val item = JSONObject().apply {
                    put("habitoId", habitoId)
                    put("valor", valor)
                    put("fechaLocal", SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()))
                    put("timestamp", System.currentTimeMillis())
                }
                lista.put(item)

                prefs.edit().putString(KEY_INCREMENTOS_PENDIENTES, lista.toString()).apply()
            } catch (_: Exception) {
            }
        }

        fun construirRemoteViews(context: Context): RemoteViews {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val esPro = prefs.getBoolean(KEY_ES_PRO, true)

            // Si el usuario no es Pro, mostramos la tarjeta exclusiva MasterGlass Pro
            if (!esPro) {
                val proViews = RemoteViews(context.packageName, R.layout.widget_habito_pro)
                val intentPro = Intent(Intent.ACTION_VIEW, Uri.parse("app://horizon")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }
                val pendingPro = PendingIntent.getActivity(context, 101, intentPro, flags)
                proViews.setOnClickPendingIntent(R.id.widget_pro_boton, pendingPro)
                proViews.setOnClickPendingIntent(R.id.widget_pro_root, pendingPro)
                return proViews
            }

            // Usuario Pro con hábito activo
            val views = RemoteViews(context.packageName, R.layout.widget_habito_foco)

            val habitoId = prefs.getString(KEY_HABITO_ID, null)
            val titulo = prefs.getString(KEY_TITULO, null)
            val completado = prefs.getBoolean(KEY_COMPLETADO, false)
            val racha = prefs.getInt(KEY_RACHA, 0)
            val imagenEtapaRecurso = prefs.getString(KEY_IMAGEN_ETAPA, null)
            val diasProgramados = jsonAListaInt(prefs.getString(KEY_DIAS_PROGRAMADOS, "[]"))
            val diasCompletados = jsonAListaInt(prefs.getString(KEY_DIAS_COMPLETADOS, "[]"))

            if (habitoId.isNullOrEmpty() || titulo.isNullOrEmpty()) {
                views.setTextViewText(R.id.widget_titulo, context.getString(R.string.widget_sin_habito_titulo))
                views.setTextColor(R.id.widget_titulo, ContextCompat.getColor(context, R.color.widget_texto_principal))
                views.setViewVisibility(R.id.widget_progreso_texto, View.VISIBLE)
                views.setTextViewText(R.id.widget_progreso_texto, context.getString(R.string.widget_sin_habito_desc))
                views.setViewVisibility(R.id.widget_racha_chip, View.GONE)
                views.setViewVisibility(R.id.widget_boton_accion, View.GONE)
                views.setViewVisibility(R.id.widget_semana_fila, View.GONE)
                // Sin ilustración real todavía — sin degradado tampoco, se vería
                // como una mancha oscura flotando sobre el fondo de cristal.
                views.setViewVisibility(R.id.widget_scrim, View.GONE)
                views.setImageViewResource(R.id.widget_etapa_imagen, R.drawable.ic_widget_leaf)
            } else {
                views.setViewVisibility(R.id.widget_racha_chip, View.VISIBLE)
                views.setViewVisibility(R.id.widget_boton_accion, View.VISIBLE)
                views.setViewVisibility(R.id.widget_semana_fila, View.VISIBLE)
                views.setViewVisibility(R.id.widget_scrim, View.VISIBLE)
                views.setViewVisibility(R.id.widget_progreso_texto, View.GONE)

                views.setTextViewText(R.id.widget_titulo, titulo)
                views.setTextColor(R.id.widget_titulo, ContextCompat.getColor(context, R.color.widget_titulo_sobre_imagen))

                // Ilustración de la etapa actual del árbol — el nombre del
                // recurso ya viene resuelto desde JS (Image.resolveAssetSource),
                // así que no hay que reconstruir rutas de carpetas por paquete.
                val idImagen = imagenEtapaRecurso
                    ?.let { context.resources.getIdentifier(it, "drawable", context.packageName) }
                    ?.takeIf { it != 0 }
                views.setImageViewResource(R.id.widget_etapa_imagen, idImagen ?: R.drawable.ic_widget_leaf)

                // Chip de racha de fuego
                views.setTextViewText(R.id.widget_racha_texto, "$racha d")

                // Estado del botón 3D / Completado
                if (completado) {
                    views.setInt(R.id.widget_boton_accion, "setBackgroundResource", R.drawable.widget_button_completed)
                    views.setImageViewResource(R.id.widget_boton_icono, R.drawable.ic_widget_check)
                } else {
                    views.setInt(R.id.widget_boton_accion, "setBackgroundResource", R.drawable.widget_button_3d)
                    views.setImageViewResource(R.id.widget_boton_icono, R.drawable.ic_widget_plus)
                }

                // Calendario semanal: lunes(1)..domingo(7), mismo día "de hoy"
                // que fechaLocal()/getDay() calcula del lado JS.
                val hoyIndice = (java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK) + 5) % 7 // 0=lunes..6=domingo
                for (offset in 0 until 7) {
                    val idDia = offset + 1
                    val estaProgramado = diasProgramados.contains(idDia)
                    val estaCompletado = diasCompletados.contains(idDia)
                    val esPasado = offset < hoyIndice
                    val viewId = IDS_DIA_SEMANA[offset]

                    when {
                        !estaProgramado -> {
                            views.setInt(viewId, "setBackgroundResource", R.drawable.widget_dia_bg_no_programado)
                            views.setTextColor(viewId, ContextCompat.getColor(context, R.color.widget_dia_texto_tenue))
                        }
                        estaCompletado -> {
                            views.setInt(viewId, "setBackgroundResource", R.drawable.widget_dia_bg_completado)
                            views.setTextColor(viewId, ContextCompat.getColor(context, R.color.widget_dia_texto_claro))
                        }
                        esPasado -> {
                            views.setInt(viewId, "setBackgroundResource", R.drawable.widget_dia_bg_perdido)
                            views.setTextColor(viewId, ContextCompat.getColor(context, R.color.widget_dia_perdido_texto))
                        }
                        else -> {
                            views.setInt(viewId, "setBackgroundResource", R.drawable.widget_dia_bg_pendiente)
                            views.setTextColor(viewId, ContextCompat.getColor(context, R.color.widget_dia_texto_oscuro))
                        }
                    }
                }
            }

            // PendingIntent para el botón de acción (+)
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val intentIncremento = Intent(context, HabitoFocoWidgetProvider::class.java).apply {
                setAction(ACTION_INCREMENTAR)
            }
            val pendingIncremento = PendingIntent.getBroadcast(context, 201, intentIncremento, flags)
            views.setOnClickPendingIntent(R.id.widget_boton_accion, pendingIncremento)

            // PendingIntent para abrir la app al tocar el cuerpo del widget
            val intentAbrir = Intent(Intent.ACTION_VIEW, Uri.parse("app://habitos")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val pendingAbrir = PendingIntent.getActivity(context, 202, intentAbrir, flags)
            views.setOnClickPendingIntent(R.id.widget_root, pendingAbrir)

            return views
        }
    }
}
