import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/LessonRunner.tsx', 'r') as f:
    content = f.read()

# Add useSafeAreaInsets import
content = content.replace("import { View, StyleSheet, SafeAreaView, Pressable } from 'react-native';", "import { View, StyleSheet, SafeAreaView, Pressable } from 'react-native';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';")

# Add insets to the component
content = content.replace("export function LessonRunner({ leccion, onTerminar }: LessonRunnerProps) {", "export function LessonRunner({ leccion, onTerminar }: LessonRunnerProps) {\n  const insets = useSafeAreaInsets();")

# Modify feedbackContenedor to use insets.bottom
old_feedback = """      {/* Hoja de Feedback (Duolingo Style) */}
      {estadoFeedback && (
        <View style={[styles.feedbackContenedor, estadoFeedback === 'correcto' ? styles.feedbackCorrecto : styles.feedbackIncorrecto]}>"""

new_feedback = """      {/* Hoja de Feedback (Duolingo Style) */}
      {estadoFeedback && (
        <View style={[styles.feedbackContenedor, estadoFeedback === 'correcto' ? styles.feedbackCorrecto : styles.feedbackIncorrecto, { paddingBottom: Math.max(insets.bottom, 20) }]}>"""

content = content.replace(old_feedback, new_feedback)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/LessonRunner.tsx', 'w') as f:
    f.write(content)
