import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const slides = [
  {
    id: 1,
    title: "Reserva Rápida",
    desc: "1. Busca tu cancha\n2. Elige tu horario\n3. ¡A jugar!",
    icon: "calendar-check-outline",
    color: "#059669",
    bg: "#ecfdf5"
  },
  {
    id: 2,
    title: "Promociones y Beneficios",
    desc: "Disfrutá de descuentos y beneficios exclusivos de la plataforma.",
    icon: "ticket-percent-outline",
    color: "#f59e0b",
    bg: "#fffbeb"
  },
  {
    id: 3,
    title: "Variedad de Instalaciones",
    desc: "Distintas canchas disponibles para reservar, con la mejor calidad e iluminación.",
    icon: "soccer-field",
    color: "#3b82f6",
    bg: "#eff6ff"
  },
  {
    id: 4,
    title: "Pagos y Confirmación",
    desc: "Aceptamos pago en el predio y Mercado Pago. Reserva al instante.",
    icon: "credit-card-outline",
    color: "#8b5cf6",
    bg: "#f5f3ff"
  },
  {
    id: 5,
    title: "Ligas y Torneos",
    desc: "Anotate en las mejores competencias y medí el nivel de tu equipo todo el año.",
    icon: "trophy-outline",
    color: "#eab308",
    bg: "#fefce8"
  },
  {
    id: 6,
    title: "Tu Propio Equipo",
    desc: "Creá tu equipo, elegí tus colores, sumá jugadores y preparate para competir al máximo nivel.",
    icon: "shield-half-full",
    color: "#ef4444",
    bg: "#fef2f2"
  }
];

export default function InfoCarousel() {
  const scrollViewRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const handleScroll = (event) => {
    if (containerWidth === 0) return;
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / containerWidth);
    if (index !== activeIndex) setActiveIndex(index);
  };

  useEffect(() => {
    if (containerWidth === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        let nextIndex = prev + 1;
        if (nextIndex >= slides.length) nextIndex = 0;
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: nextIndex * containerWidth, y: 0, animated: true });
        }
        return nextIndex;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [containerWidth]);

  return (
    <View
      style={styles.carouselContainer}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <View style={{ width: containerWidth, overflow: 'hidden' }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            style={{ width: containerWidth }}
          >
            {slides.map((slide) => (
              <View key={slide.id} style={{ width: containerWidth, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }}>
                <View style={[styles.slideInner, { backgroundColor: slide.bg, borderColor: slide.color + '40' }]}>
                <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
                  <MaterialCommunityIcons name={slide.icon} size={42} color={slide.color} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.title, { color: slide.color }]} selectable={false}>{slide.title}</Text>
                  <Text style={styles.desc} selectable={false}>{slide.desc}</Text>
                </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    marginTop: 25,
    marginBottom: 10,
    width: '100%',
  },
  slideInner: {
    width: '100%',
    maxWidth: 800,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.5,
    ...Platform.select({ web: { userSelect: 'none' } })
  },
  desc: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 20,
    ...Platform.select({ web: { userSelect: 'none' } })
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    ...Platform.select({
      web: { transition: 'all 0.3s ease' }
    })
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    width: 8,
  }
});
