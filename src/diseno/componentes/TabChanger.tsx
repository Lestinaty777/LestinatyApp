import React, { useState } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Texto } from './Texto';
import { RecuadroGlass } from './RecuadroGlass';
import { resolverIndiceTab } from './tabChanger.estado';
import { useEscala } from '../tema/MasterColorContext';
import type { EscalaMaster } from '../tema/escalaEsmeralda';

export function TabChanger({
  tabs = ['Categorías', 'Hábitos'],
  value,
  defaultValue = 0,
  onTabChange,
}: {
  tabs?: [string, string];
  value?: number;
  defaultValue?: number;
  onTabChange?: (index: number) => void;
}) {
  const styles = useEstilosStyles();
  const [internalIndex, setInternalIndex] = useState(defaultValue);
  const [width, setWidth] = useState(0);
  const activeIndex = resolverIndiceTab({ value, defaultValue, interno: internalIndex, cantidad: tabs.length });

  const handlePress = (index: number) => {
    if (value === undefined) setInternalIndex(index);
    if (onTabChange) onTabChange(index);
  };

  const animStyle = useAnimatedStyle(() => {
    const tabWidth = width / 2;
    return {
      transform: [
        {
          translateX: withSpring(activeIndex * tabWidth, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
      width: tabWidth,
    };
  });

  return (
    <RecuadroGlass style={styles.container}>
      {width > 0 && <Animated.View style={[styles.activePill, animStyle]} />}
      
      <View 
        style={styles.tabsRow}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        {tabs.map((tab, i) => {
          const isActive = activeIndex === i;
          return (
            <Pressable
              key={i}
              style={styles.tab}
              onPress={() => handlePress(i)}
            >
              <Texto style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Texto>
            </Pressable>
          );
        })}
      </View>
    </RecuadroGlass>
  );
}

const crearEstilosStyles = (esc: EscalaMaster) => StyleSheet.create({
  container: {
    borderRadius: 20, // Capsula
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    width: '100%',
    overflow: 'hidden',
  },
  activePill: {
    position: 'absolute',
    left: 2, // Accounting for padding
    top: 2,
    height: 26,
    backgroundColor: esc.jade.l70, // Verde saturado
    borderRadius: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#7B7494', // Gris
  },
  tabTextActive: {
    color: '#FFFFFF', // Blanco
  },
});

const estilosPorEscalaStyles = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosStyles>>();

function useEstilosStyles() {
  const esc = useEscala();
  let valor = estilosPorEscalaStyles.get(esc);
  if (!valor) {
    valor = crearEstilosStyles(esc);
    estilosPorEscalaStyles.set(esc, valor);
  }
  return valor;
}
