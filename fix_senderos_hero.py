import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    code = f.read()

# 1. Add BarraProgresoLiquida import
if 'BarraProgresoLiquida' not in code:
    code = code.replace("import FogEffectSkia", "import { BarraProgresoLiquida } from '../../../diseno/componentes/BarraProgresoLiquida';\nimport FogEffectSkia")

# 2. Add sharedHeroData state
old_state = "  const [pestanaActiva, setPestanaActiva] = useState<PaginaSenderosId>('mis-senderos');"
new_state = "  const [pestanaActiva, setPestanaActiva] = useState<PaginaSenderosId>('mis-senderos');\n  const [sharedHeroData, setSharedHeroData] = useState<any>(null);"
code = code.replace(old_state, new_state)

# 3. Update <CompartidosSenderos /> to pass prop
old_comp = "<CompartidosSenderos />"
new_comp = "<CompartidosSenderos onHeroDataChange={setSharedHeroData} />"
code = code.replace(old_comp, new_comp)

# 4. Modify the empty state JSX
old_empty = """        <Reanimated.View key={'emp-' + headerTitle} entering={FadeInDown.delay(500).duration(500)} style={styles.estadoVacioPosicion}>
          <RecuadroGlass style={styles.estadoVacio}>
            <View style={styles.iconoPlanta}>
              <EmptyIcon color={emptyIconColor} size={20} strokeWidth={2.4} />
            </View>
            <Texto style={styles.estadoTitulo}>{emptyStateTitle}</Texto>
            <Texto style={styles.estadoSubtitulo}>
              {emptyStateSub}
            </Texto>
          </RecuadroGlass>
        </Reanimated.View>"""

new_empty = """        <Reanimated.View key={'emp-' + headerTitle + (sharedHeroData?.id || '')} entering={FadeInDown.delay(500).duration(500)} style={styles.estadoVacioPosicion}>
          <RecuadroGlass style={styles.estadoVacio}>
            {pestanaActiva === 'compartidos' && sharedHeroData ? (
              <View style={{ gap: 4 }}>
                <Texto style={[styles.estadoTitulo, { color: sharedHeroData.acento }]}>{sharedHeroData.titulo}</Texto>
                <Texto style={styles.estadoSubtitulo} numberOfLines={2}>{sharedHeroData.descripcion}</Texto>
                <View style={{ marginTop: 4 }}>
                  <BarraProgresoLiquida porcentaje={sharedHeroData.progresoPorcentaje} color={sharedHeroData.acento} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                  <View style={{ flexDirection: 'row' }}>
                    {sharedHeroData.miembros.map((m: any, i: number) => (
                      <View key={m.id} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: m.colorAvatar, justifyContent: 'center', alignItems: 'center', marginLeft: i > 0 ? -6 : 0, borderWidth: 1, borderColor: '#FFF' }}>
                        <Texto style={{ fontSize: 6, fontFamily: 'MontserratAlternates-Bold', color: '#FFF' }}>{m.iniciales}</Texto>
                      </View>
                    ))}
                  </View>
                  <Texto style={{ fontSize: 8, fontFamily: 'MontserratAlternates-Bold', color: '#777' }}>{sharedHeroData.progresoPorcentaje}% Completado</Texto>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.iconoPlanta}>
                  <EmptyIcon color={emptyIconColor} size={20} strokeWidth={2.4} />
                </View>
                <Texto style={styles.estadoTitulo}>{emptyStateTitle}</Texto>
                <Texto style={styles.estadoSubtitulo}>
                  {emptyStateSub}
                </Texto>
              </>
            )}
          </RecuadroGlass>
        </Reanimated.View>"""

code = code.replace(old_empty, new_empty)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(code)

