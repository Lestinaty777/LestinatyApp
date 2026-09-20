package com.lestinaty.widget

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Servicio en primer plano que mantiene viva la notificación con Chronometer
 * de una sesión de hábito tipo "duración" (ej. meditar) — visible incluso con
 * la app cerrada o la pantalla bloqueada. La app JS sigue llevando su propio
 * cronómetro local para la UI dentro de la pantalla; este servicio es la
 * fuente de verdad que sobrevive a que la app se vaya a segundo plano, y con
 * la que la pantalla se resincroniza al volver a enfocarse.
 */
class CronometroHabitoService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        when (intent?.action) {
            ACTION_INICIAR -> {
                val habitoId = intent.getStringExtra(EXTRA_HABITO_ID) ?: return detenerComando(startId)
                val titulo = intent.getStringExtra(EXTRA_TITULO) ?: ""
                val color = intent.getStringExtra(EXTRA_COLOR) ?: "#21A844"
                val segundosIniciales = intent.getIntExtra(EXTRA_SEGUNDOS_INICIALES, 0)

                prefs.edit()
                    .putString(KEY_HABITO_ID, habitoId)
                    .putString(KEY_TITULO, titulo)
                    .putString(KEY_COLOR, color)
                    .putBoolean(KEY_CORRIENDO, true)
                    .putInt(KEY_SEGUNDOS_ACUMULADOS, segundosIniciales)
                    .putLong(KEY_BASE_ELAPSED, SystemClock.elapsedRealtime())
                    .apply()

                iniciarEnPrimerPlano(prefs)
            }

            ACTION_REANUDAR -> {
                if (prefs.getString(KEY_HABITO_ID, null) == null) return detenerComando(startId)
                prefs.edit()
                    .putBoolean(KEY_CORRIENDO, true)
                    .putLong(KEY_BASE_ELAPSED, SystemClock.elapsedRealtime())
                    .apply()
                actualizarNotificacion(prefs)
                HabitoWidgetModule.emitirEventoCronometro("reanudado", prefs.getString(KEY_HABITO_ID, "") ?: "", segundosActuales(prefs))
            }

            ACTION_PAUSAR -> {
                prefs.edit()
                    .putInt(KEY_SEGUNDOS_ACUMULADOS, segundosActuales(prefs))
                    .putBoolean(KEY_CORRIENDO, false)
                    .apply()
                actualizarNotificacion(prefs)
                HabitoWidgetModule.emitirEventoCronometro("pausado", prefs.getString(KEY_HABITO_ID, "") ?: "", segundosActuales(prefs))
            }

            // Detener desde la app (la pantalla ya se encarga de guardar el
            // progreso vía su propia mutación) — no se encola nada acá, solo
            // se limpia el estado nativo y se quita la notificación.
            ACTION_DETENER -> {
                limpiarEstado(prefs)
                detenerServicio()
            }

            // Detener desde el botón de la notificación — no hay pantalla
            // activa confirmando el guardado, así que se encola la sesión
            // (mismo patrón offline-first que los incrementos del widget) y
            // se avisa a JS por si la app sigue viva para procesarla ya.
            ACTION_FINALIZAR -> {
                val habitoId = prefs.getString(KEY_HABITO_ID, null)
                val segundos = segundosActuales(prefs)
                if (habitoId != null && segundos >= 30) {
                    encolarSesionPendiente(prefs, habitoId, segundos)
                }
                limpiarEstado(prefs)
                detenerServicio()
                if (habitoId != null) HabitoWidgetModule.emitirEventoCronometro("finalizado", habitoId, segundos)
            }

            else -> return detenerComando(startId)
        }

        return START_NOT_STICKY
    }

    private fun detenerComando(startId: Int): Int {
        stopSelf(startId)
        return START_NOT_STICKY
    }

    private fun detenerServicio() {
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun limpiarEstado(prefs: android.content.SharedPreferences) {
        prefs.edit()
            .remove(KEY_HABITO_ID)
            .remove(KEY_TITULO)
            .remove(KEY_COLOR)
            .putBoolean(KEY_CORRIENDO, false)
            .putInt(KEY_SEGUNDOS_ACUMULADOS, 0)
            .apply()
    }

    private fun iniciarEnPrimerPlano(prefs: android.content.SharedPreferences) {
        crearCanalNotificacion()
        val notificacion = construirNotificacion(prefs)
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            notificacion,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
        )
    }

    private fun actualizarNotificacion(prefs: android.content.SharedPreferences) {
        if (prefs.getString(KEY_HABITO_ID, null) == null) return
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, construirNotificacion(prefs))
    }

    private fun crearCanalNotificacion() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CANAL_ID) != null) return
        val canal = NotificationChannel(
            CANAL_ID,
            getString(R.string.cronometro_canal_nombre),
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = getString(R.string.cronometro_canal_desc)
            setShowBadge(false)
        }
        manager.createNotificationChannel(canal)
    }

    private fun construirNotificacion(prefs: android.content.SharedPreferences): android.app.Notification {
        val titulo = prefs.getString(KEY_TITULO, "") ?: ""
        val corriendo = prefs.getBoolean(KEY_CORRIENDO, false)
        val segundos = segundosActuales(prefs)

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val intentAbrir = Intent(Intent.ACTION_VIEW, Uri.parse("app://habitos")).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val pendingAbrir = PendingIntent.getActivity(this, 301, intentAbrir, flags)

        fun pendingAccion(accion: String, requestCode: Int): PendingIntent {
            // Intent.setAction() devuelve Intent (no void), así que Kotlin no
            // sintetiza `action` como var asignable — hay que llamarlo como
            // método (mismo motivo por el que `flags =` tampoco compila).
            val intent = Intent(this, CronometroHabitoService::class.java).apply { setAction(accion) }
            return PendingIntent.getService(this, requestCode, intent, flags)
        }

        val builder = NotificationCompat.Builder(this, CANAL_ID)
            .setSmallIcon(R.drawable.ic_notif_cronometro)
            .setContentTitle(titulo)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pendingAbrir)
            .setCategory(NotificationCompat.CATEGORY_STOPWATCH)

        if (corriendo) {
            builder
                .setUsesChronometer(true)
                .setWhen(System.currentTimeMillis() - segundos * 1000L)
                .setContentText(getString(R.string.cronometro_en_curso))
                .addAction(R.drawable.ic_notif_pausa, getString(R.string.cronometro_accion_pausar), pendingAccion(ACTION_PAUSAR, 302))
        } else {
            builder
                .setUsesChronometer(false)
                .setContentText(getString(R.string.cronometro_en_pausa, formatoTiempo(segundos)))
                .addAction(R.drawable.ic_notif_play, getString(R.string.cronometro_accion_reanudar), pendingAccion(ACTION_REANUDAR, 303))
        }
        builder.addAction(R.drawable.ic_notif_check, getString(R.string.cronometro_accion_finalizar), pendingAccion(ACTION_FINALIZAR, 304))

        return builder.build()
    }

    private fun formatoTiempo(segundos: Int): String {
        val m = segundos / 60
        val s = segundos % 60
        return String.format(Locale.getDefault(), "%02d:%02d", m, s)
    }

    private fun encolarSesionPendiente(prefs: android.content.SharedPreferences, habitoId: String, segundos: Int) {
        try {
            val raw = prefs.getString(KEY_SESIONES_PENDIENTES, "[]") ?: "[]"
            val lista = JSONArray(raw)
            val minutos = maxOf(1, Math.round(segundos / 60.0).toInt())
            val item = JSONObject().apply {
                put("habitoId", habitoId)
                put("valor", minutos)
                put("fechaLocal", SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()))
                put("timestamp", System.currentTimeMillis())
            }
            lista.put(item)
            prefs.edit().putString(KEY_SESIONES_PENDIENTES, lista.toString()).apply()
        } catch (_: Exception) {
        }
    }

    companion object {
        const val PREFS_NAME = "LestinatyCronometroPrefs"

        const val ACTION_INICIAR = "com.lestinaty.widget.cronometro.ACTION_INICIAR"
        const val ACTION_PAUSAR = "com.lestinaty.widget.cronometro.ACTION_PAUSAR"
        const val ACTION_REANUDAR = "com.lestinaty.widget.cronometro.ACTION_REANUDAR"
        const val ACTION_DETENER = "com.lestinaty.widget.cronometro.ACTION_DETENER"
        const val ACTION_FINALIZAR = "com.lestinaty.widget.cronometro.ACTION_FINALIZAR"

        const val EXTRA_HABITO_ID = "habitoId"
        const val EXTRA_TITULO = "titulo"
        const val EXTRA_COLOR = "color"
        const val EXTRA_SEGUNDOS_INICIALES = "segundosIniciales"

        const val KEY_HABITO_ID = "habito_id"
        const val KEY_TITULO = "titulo"
        const val KEY_COLOR = "color"
        const val KEY_CORRIENDO = "corriendo"
        const val KEY_SEGUNDOS_ACUMULADOS = "segundos_acumulados"
        const val KEY_BASE_ELAPSED = "base_elapsed_realtime"
        const val KEY_SESIONES_PENDIENTES = "sesiones_pendientes"

        private const val CANAL_ID = "cronometro_habito_v1"
        private const val NOTIFICATION_ID = 9001

        fun segundosActuales(prefs: android.content.SharedPreferences): Int {
            val acumulados = prefs.getInt(KEY_SEGUNDOS_ACUMULADOS, 0)
            if (!prefs.getBoolean(KEY_CORRIENDO, false)) return acumulados
            val base = prefs.getLong(KEY_BASE_ELAPSED, SystemClock.elapsedRealtime())
            val transcurrido = ((SystemClock.elapsedRealtime() - base) / 1000L).toInt()
            return acumulados + maxOf(0, transcurrido)
        }
    }
}
