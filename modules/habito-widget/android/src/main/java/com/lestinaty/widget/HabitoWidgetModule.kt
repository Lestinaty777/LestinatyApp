package com.lestinaty.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

private fun iniciarServicioEnPrimerPlano(context: Context, intent: Intent) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
    } else {
        context.startService(intent)
    }
}

private fun numerosAJson(lista: List<*>): String {
    val jsonArray = JSONArray()
    lista.forEach { (it as? Number)?.let { numero -> jsonArray.put(numero.toInt()) } }
    return jsonArray.toString()
}

class HabitoWidgetModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("ReactContext no disponible")

    override fun definition() = ModuleDefinition {
        Name("HabitoWidget")

        Events("onIncrementoWidget", "onCronometroEvento")

        AsyncFunction("sincronizarHabito") { datos: Map<String, Any?> ->
            val prefs = context.getSharedPreferences(HabitoFocoWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
            val editor = prefs.edit()

            datos["habitoId"]?.let { editor.putString(HabitoFocoWidgetProvider.KEY_HABITO_ID, it.toString()) }
            datos["titulo"]?.let { editor.putString(HabitoFocoWidgetProvider.KEY_TITULO, it.toString()) }
            datos["color"]?.let { editor.putString(HabitoFocoWidgetProvider.KEY_COLOR, it.toString()) }
            datos["unidad"]?.let { editor.putString(HabitoFocoWidgetProvider.KEY_UNIDAD, it.toString()) }
            datos["tipoMeta"]?.let { editor.putString(HabitoFocoWidgetProvider.KEY_TIPO_META, it.toString()) }

            (datos["actual"] as? Number)?.let { editor.putInt(HabitoFocoWidgetProvider.KEY_ACTUAL, it.toInt()) }
            (datos["meta"] as? Number)?.let { editor.putInt(HabitoFocoWidgetProvider.KEY_META, it.toInt()) }
            (datos["racha"] as? Number)?.let { editor.putInt(HabitoFocoWidgetProvider.KEY_RACHA, it.toInt()) }
            (datos["nivel"] as? Number)?.let { editor.putInt(HabitoFocoWidgetProvider.KEY_NIVEL, it.toInt()) }
            (datos["completado"] as? Boolean)?.let { editor.putBoolean(HabitoFocoWidgetProvider.KEY_COMPLETADO, it) }
            (datos["esPro"] as? Boolean)?.let { editor.putBoolean(HabitoFocoWidgetProvider.KEY_ES_PRO, it) }
            datos["imagenEtapaRecurso"]?.let { editor.putString(HabitoFocoWidgetProvider.KEY_IMAGEN_ETAPA, it.toString()) }
            (datos["diasProgramados"] as? List<*>)?.let { editor.putString(HabitoFocoWidgetProvider.KEY_DIAS_PROGRAMADOS, numerosAJson(it)) }
            (datos["diasCompletadosSemana"] as? List<*>)?.let { editor.putString(HabitoFocoWidgetProvider.KEY_DIAS_COMPLETADOS, numerosAJson(it)) }

            editor.apply()

            HabitoFocoWidgetProvider.actualizarTodosLosWidgets(context)
            true
        }

        AsyncFunction("sincronizarCalendario") { datos: Map<String, Any?> ->
            val prefs = context.getSharedPreferences(CalendarioWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
            val editor = prefs.edit()

            (datos["anio"] as? Number)?.let { editor.putInt(CalendarioWidgetProvider.KEY_ANIO, it.toInt()) }
            (datos["mes"] as? Number)?.let { editor.putInt(CalendarioWidgetProvider.KEY_MES, it.toInt()) }
            (datos["diasCompletados"] as? List<*>)?.let { editor.putString(CalendarioWidgetProvider.KEY_DIAS_COMPLETADOS, numerosAJson(it)) }

            editor.apply()

            CalendarioWidgetProvider.actualizarTodosLosWidgets(context)
            true
        }

        AsyncFunction("iniciarCronometro") { datos: Map<String, Any?> ->
            val intent = Intent(context, CronometroHabitoService::class.java).apply {
                setAction(CronometroHabitoService.ACTION_INICIAR)
                putExtra(CronometroHabitoService.EXTRA_HABITO_ID, datos["habitoId"]?.toString())
                putExtra(CronometroHabitoService.EXTRA_TITULO, datos["titulo"]?.toString() ?: "")
                putExtra(CronometroHabitoService.EXTRA_COLOR, datos["color"]?.toString() ?: "#21A844")
                putExtra(CronometroHabitoService.EXTRA_SEGUNDOS_INICIALES, (datos["segundosIniciales"] as? Number)?.toInt() ?: 0)
            }
            iniciarServicioEnPrimerPlano(context, intent)
            true
        }

        AsyncFunction("pausarCronometro") { ->
            context.startService(Intent(context, CronometroHabitoService::class.java).apply { setAction(CronometroHabitoService.ACTION_PAUSAR) })
            true
        }

        AsyncFunction("reanudarCronometro") { ->
            iniciarServicioEnPrimerPlano(context, Intent(context, CronometroHabitoService::class.java).apply { setAction(CronometroHabitoService.ACTION_REANUDAR) })
            true
        }

        AsyncFunction("detenerCronometro") { ->
            context.startService(Intent(context, CronometroHabitoService::class.java).apply { setAction(CronometroHabitoService.ACTION_DETENER) })
            true
        }

        AsyncFunction("obtenerEstadoCronometro") { ->
            val prefs = context.getSharedPreferences(CronometroHabitoService.PREFS_NAME, Context.MODE_PRIVATE)
            val habitoId = prefs.getString(CronometroHabitoService.KEY_HABITO_ID, null)
            mapOf(
                "activo" to (habitoId != null),
                "habitoId" to habitoId,
                "corriendo" to prefs.getBoolean(CronometroHabitoService.KEY_CORRIENDO, false),
                "segundos" to CronometroHabitoService.segundosActuales(prefs)
            )
        }

        AsyncFunction("obtenerSesionesPendientesCronometro") { ->
            val prefs = context.getSharedPreferences(CronometroHabitoService.PREFS_NAME, Context.MODE_PRIVATE)
            val raw = prefs.getString(CronometroHabitoService.KEY_SESIONES_PENDIENTES, "[]") ?: "[]"
            val jsonArray = JSONArray(raw)
            val result = mutableListOf<Map<String, Any?>>()
            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(i)
                result.add(mapOf(
                    "habitoId" to item.getString("habitoId"),
                    "valor" to item.getInt("valor"),
                    "fechaLocal" to item.getString("fechaLocal"),
                    "timestamp" to item.getLong("timestamp")
                ))
            }
            result
        }

        AsyncFunction("limpiarSesionesPendientesCronometro") { ->
            val prefs = context.getSharedPreferences(CronometroHabitoService.PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(CronometroHabitoService.KEY_SESIONES_PENDIENTES, "[]").apply()
            true
        }

        AsyncFunction("solicitarFijarWidget") { ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val myProvider = ComponentName(context, HabitoFocoWidgetProvider::class.java)
                if (appWidgetManager.isRequestPinAppWidgetSupported) {
                    appWidgetManager.requestPinAppWidget(myProvider, null, null)
                    true
                } else {
                    false
                }
            } else {
                false
            }
        }

        AsyncFunction("solicitarFijarWidgetCalendario") { ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val myProvider = ComponentName(context, CalendarioWidgetProvider::class.java)
                if (appWidgetManager.isRequestPinAppWidgetSupported) {
                    appWidgetManager.requestPinAppWidget(myProvider, null, null)
                    true
                } else {
                    false
                }
            } else {
                false
            }
        }

        AsyncFunction("obtenerIncrementosPendientes") { ->
            val prefs = context.getSharedPreferences(HabitoFocoWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
            val raw = prefs.getString(HabitoFocoWidgetProvider.KEY_INCREMENTOS_PENDIENTES, "[]") ?: "[]"
            val jsonArray = JSONArray(raw)
            val result = mutableListOf<Map<String, Any?>>()
            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(i)
                result.add(mapOf(
                    "habitoId" to item.getString("habitoId"),
                    "valor" to item.getInt("valor"),
                    "fechaLocal" to item.getString("fechaLocal"),
                    "timestamp" to item.getLong("timestamp")
                ))
            }
            result
        }

        AsyncFunction("limpiarIncrementosPendientes") { ->
            val prefs = context.getSharedPreferences(HabitoFocoWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(HabitoFocoWidgetProvider.KEY_INCREMENTOS_PENDIENTES, "[]").apply()
            true
        }
    }

    companion object {
        private var instanciaActual: HabitoWidgetModule? = null

        fun emitirIncremento(habitoId: String, nuevoValor: Int) {
            instanciaActual?.sendEvent("onIncrementoWidget", bundleOf(
                "habitoId" to habitoId,
                "nuevoValor" to nuevoValor
            ))
        }

        // Solo para feedback inmediato de UI cuando la app está viva — el
        // registro real del progreso siempre pasa por la cola de sesiones
        // pendientes (obtenerSesionesPendientesCronometro), nunca por este
        // evento directamente, para no acreditar dos veces la misma sesión.
        fun emitirEventoCronometro(tipo: String, habitoId: String, segundos: Int) {
            instanciaActual?.sendEvent("onCronometroEvento", bundleOf(
                "tipo" to tipo,
                "habitoId" to habitoId,
                "segundos" to segundos
            ))
        }
    }

    init {
        instanciaActual = this
    }
}
