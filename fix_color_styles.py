import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/LessonRunner.tsx', 'r') as f:
    content = f.read()

# Fix barraProgreso inline style
content = content.replace(
    "<View style={[styles.barraProgreso, { width: `${progresoPorcentaje}%` }]} />",
    "<View style={[styles.barraProgreso, { width: `${progresoPorcentaje}%`, backgroundColor: color }]} />"
)
content = content.replace("barraProgreso: { height: '100%', backgroundColor: color, borderRadius: 8 },", "barraProgreso: { height: '100%', borderRadius: 8 },")

# Fix feedback sheet inline style
content = content.replace(
    "estadoFeedback === 'correcto' ? styles.feedbackCorrecto : styles.feedbackIncorrecto,",
    "estadoFeedback === 'correcto' ? [styles.feedbackCorrecto, { backgroundColor: color }] : styles.feedbackIncorrecto,"
)
content = content.replace("feedbackCorrecto: { backgroundColor: color },", "feedbackCorrecto: {},")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/LessonRunner.tsx', 'w') as f:
    f.write(content)
