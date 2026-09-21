package com.lestinaty.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.net.Uri
import android.os.Build
import android.view.View
import android.widget.RemoteViews
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

        when (intent.action) {
            ACTION_INCREMENTAR -> manejarIncremento(context)
            ACTION_ANTERIOR -> moverIndice(context, -1)
            ACTION_SIGUIENTE -> moverIndice(context, 1)
            else -> return
        }
        actualizarTodosLosWidgets(context)
    }

    companion object {
        const val PREFS_NAME = "LestinatyHabitoWidgetPrefs"
        const val ACTION_INCREMENTAR = "com.lestinaty.widget.ACTION_INCREMENTAR"
        const val ACTION_ANTERIOR = "com.lestinaty.widget.ACTION_ANTERIOR"
        const val ACTION_SIGUIENTE = "com.lestinaty.widget.ACTION_SIGUIENTE"

        // Claves SharedPreferences — el widget navega entre TODOS los hábitos
        // de hoy con los chevrones, así que se guarda la lista completa (no
        // un solo "foco") más el índice que se está mostrando ahora mismo.
        const val KEY_LISTA_HABITOS = "lista_habitos_hoy"
        const val KEY_INDICE_ACTUAL = "indice_actual"
        const val KEY_ES_PRO = "es_pro"
        const val KEY_INCREMENTOS_PENDIENTES = "incrementos_pendientes"

        private fun listaHabitos(prefs: android.content.SharedPreferences): JSONArray {
            return try {
                JSONArray(prefs.getString(KEY_LISTA_HABITOS, "[]") ?: "[]")
            } catch (_: Exception) {
                JSONArray()
            }
        }

        private fun indiceValido(indice: Int, total: Int): Int {
            if (total <= 0) return 0
            return ((indice % total) + total) % total
        }

        private fun colorOTransparente(hex: String): Int? = try {
            if (hex.isEmpty()) null else Color.parseColor(hex)
        } catch (_: Exception) {
            null
        }

        // Fondo MasterGlass ya rotado al tono del paquete (los 3 colores
        // vienen calculados desde JS con la misma matemática de HSL que usa
        // el resto de la UI — ver crearTonoMaster en masterColor.ts). No se
        // puede mutar el Drawable estático en vivo (RemoteViews no acepta
        // referencias a objetos, solo ids de recursos o Bitmaps), así que se
        // dibuja a un Bitmap con Canvas/LinearGradient nativos de Android —
        // sin Skia, sin dependencias nuevas. Tamaño fijo (no por-instancia):
        // el widget no permite resize (ver widget_habito_foco_info.xml), así
        // que las esquinas redondeadas nunca se estiran de forma distinta.
        private const val ANCHO_FONDO_DP = 250f
        private const val ALTO_FONDO_DP = 110f

        private fun crearFondoGlass(context: Context, claro: Int, medio: Int, oscuro: Int): Bitmap {
            val densidad = context.resources.displayMetrics.density
            val ancho = max(1, (ANCHO_FONDO_DP * densidad).roundToInt())
            val alto = max(1, (ALTO_FONDO_DP * densidad).roundToInt())
            val bitmap = Bitmap.createBitmap(ancho, alto, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            val radio = alto * 0.22f
            val inset = 1.5f * densidad
            val rect = RectF(inset, inset, ancho - inset, alto - inset)

            val pincelRelleno = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                shader = LinearGradient(
                    0f, 0f, ancho.toFloat(), alto.toFloat(),
                    intArrayOf(claro, medio, oscuro), floatArrayOf(0f, 0.55f, 1f),
                    Shader.TileMode.CLAMP
                )
            }
            canvas.drawRoundRect(rect, radio, radio, pincelRelleno)

            val pincelBorde = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = 1.5f * densidad
                color = 0x40FFFFFF
            }
            canvas.drawRoundRect(rect, radio, radio, pincelBorde)

            return bitmap
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

        private fun moverIndice(context: Context, delta: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val lista = listaHabitos(prefs)
            if (lista.length() <= 1) return
            val actual = prefs.getInt(KEY_INDICE_ACTUAL, 0)
            prefs.edit().putInt(KEY_INDICE_ACTUAL, indiceValido(actual + delta, lista.length())).apply()
        }

        private fun manejarIncremento(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val esPro = prefs.getBoolean(KEY_ES_PRO, true)
            if (!esPro) return

            val lista = listaHabitos(prefs)
            if (lista.length() == 0) return
            val indice = indiceValido(prefs.getInt(KEY_INDICE_ACTUAL, 0), lista.length())
            val item = lista.getJSONObject(indice)

            val habitoId = item.getString("habitoId")
            val completado = item.optBoolean("completado", false)
            if (completado) return

            val meta = item.optInt("meta", 1)
            val actual = item.optInt("actual", 0)
            val tipoMeta = item.optString("tipoMeta", "cantidad")

            val nuevoValor = if (tipoMeta == "check") {
                meta
            } else {
                val paso = if (meta >= 10) max(1, (meta / 8.0).roundToInt()) else 1
                min(meta, actual + paso)
            }
            val nuevoCompletado = nuevoValor >= meta

            // Actualiza el ítem dentro de la lista guardada (offline-first,
            // instantáneo) y lo deja tal cual hasta que la próxima sincronización
            // real desde la app confirme el valor definitivo.
            item.put("actual", nuevoValor)
            item.put("completado", nuevoCompletado)
            lista.put(indice, item)
            prefs.edit().putString(KEY_LISTA_HABITOS, lista.toString()).apply()

            encolarIncrementoParaSupabase(context, habitoId, nuevoValor)
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

            val views = RemoteViews(context.packageName, R.layout.widget_habito_foco)
            val lista = listaHabitos(prefs)

            if (lista.length() == 0) {
                views.setImageViewResource(R.id.widget_fondo, R.drawable.widget_masterglass_bg)
                views.setViewVisibility(R.id.widget_contenido_variable, View.GONE)
                views.setViewVisibility(R.id.widget_chevron_izquierda, View.GONE)
                views.setViewVisibility(R.id.widget_chevron_derecha, View.GONE)
                views.setViewVisibility(R.id.widget_progreso_texto, View.VISIBLE)
                views.setTextViewText(R.id.widget_progreso_texto, context.getString(R.string.widget_sin_habito_desc))
            } else {
                val indice = indiceValido(prefs.getInt(KEY_INDICE_ACTUAL, 0), lista.length())
                val item = lista.getJSONObject(indice)

                views.setViewVisibility(R.id.widget_contenido_variable, View.VISIBLE)
                views.setViewVisibility(R.id.widget_progreso_texto, View.GONE)
                // Con un solo hábito no hay entre qué navegar.
                val hayVarios = lista.length() > 1
                views.setViewVisibility(R.id.widget_chevron_izquierda, if (hayVarios) View.VISIBLE else View.GONE)
                views.setViewVisibility(R.id.widget_chevron_derecha, if (hayVarios) View.VISIBLE else View.GONE)

                val titulo = item.optString("titulo", "")
                val actual = item.optInt("actual", 0)
                val meta = max(1, item.optInt("meta", 1))

                views.setTextViewText(R.id.widget_titulo, titulo)
                views.setProgressBar(R.id.widget_barra, 100, min(100, actual * 100 / meta), false)

                // Ícono real del hábito (el elegido en el asistente) e
                // ilustración de la etapa actual — ambos ya vienen resueltos
                // desde JS como nombre de recurso (Image.resolveAssetSource),
                // así el lado nativo no reconstruye rutas de assets.
                val idIcono = item.optString("iconoRecurso", null)
                    ?.let { context.resources.getIdentifier(it, "drawable", context.packageName) }
                    ?.takeIf { it != 0 }
                views.setImageViewResource(R.id.widget_icono_habito, idIcono ?: R.drawable.ic_widget_leaf)

                val idImagen = item.optString("imagenEtapaRecurso", null)
                    ?.let { context.resources.getIdentifier(it, "drawable", context.packageName) }
                    ?.takeIf { it != 0 }
                views.setImageViewResource(R.id.widget_etapa_imagen, idImagen ?: R.drawable.ic_widget_leaf)

                // Fondo MasterGlass y tinte del ícono, ambos ya rotados al
                // tono del paquete (mismo cálculo que usa el resto de la UI,
                // hecho en JS) — acá solo se dibuja/aplica.
                val claro = colorOTransparente(item.optString("fondoClaro", ""))
                val medio = colorOTransparente(item.optString("fondoMedio", ""))
                val oscuro = colorOTransparente(item.optString("fondoOscuro", ""))
                if (claro != null && medio != null && oscuro != null) {
                    views.setImageViewBitmap(R.id.widget_fondo, crearFondoGlass(context, claro, medio, oscuro))
                } else {
                    views.setImageViewResource(R.id.widget_fondo, R.drawable.widget_masterglass_bg)
                }

                // Sin color válido, el ícono se queda con su color natural del
                // PNG — no hace falta "limpiar" nada porque cada RemoteViews
                // se construye de cero, sin filtro previo que arrastrar.
                val colorIcono = colorOTransparente(item.optString("iconoAcento", ""))
                if (colorIcono != null) {
                    views.setInt(R.id.widget_icono_habito, "setColorFilter", colorIcono)
                }
            }

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            fun pendingAccion(accion: String, requestCode: Int): PendingIntent {
                val intent = Intent(context, HabitoFocoWidgetProvider::class.java).apply { setAction(accion) }
                return PendingIntent.getBroadcast(context, requestCode, intent, flags)
            }

            // Tocar la barra registra avance del hábito que se está mostrando ahora.
            views.setOnClickPendingIntent(R.id.widget_barra, pendingAccion(ACTION_INCREMENTAR, 201))
            views.setOnClickPendingIntent(R.id.widget_chevron_izquierda, pendingAccion(ACTION_ANTERIOR, 203))
            views.setOnClickPendingIntent(R.id.widget_chevron_derecha, pendingAccion(ACTION_SIGUIENTE, 204))

            // Tocar el resto del widget (ícono, título, ilustración) abre la app.
            val intentAbrir = Intent(Intent.ACTION_VIEW, Uri.parse("app://habitos")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val pendingAbrir = PendingIntent.getActivity(context, 202, intentAbrir, flags)
            views.setOnClickPendingIntent(R.id.widget_root, pendingAbrir)

            return views
        }
    }
}
