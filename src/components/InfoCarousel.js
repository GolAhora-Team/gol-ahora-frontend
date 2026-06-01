import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, useWindowDimensions } from 'react-native';
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
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 600;
  
  const MULTIPLIER = 50;
  const extendedSlides = Array.from({ length: MULTIPLIER }).flatMap((_, i) => 
    slides.map(s => ({ ...s, uniqueId: `${i}-${s.id}` }))
  );
  const START_INDEX = slides.length * Math.floor(MULTIPLIER / 2);

  const scrollViewRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(START_INDEX);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // El slide toma un 85% en móvil y un 60% en web (max 550px) para dejar ver los costados
  const slideWidth = isMobile ? containerWidth * 0.85 : Math.min(550, containerWidth * 0.6);
  const padding = containerWidth > 0 ? (containerWidth - slideWidth) / 2 : 0;

  const handleScroll = (event) => {
    if (slideWidth === 0) return;
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / slideWidth);
    if (index !== activeIndex) setActiveIndex(index);
  };

  useEffect(() => {
    if (slideWidth > 0 && scrollViewRef.current && !isReady) {
      scrollViewRef.current.scrollTo({ x: START_INDEX * slideWidth, animated: false });
      setIsReady(true);
    }
  }, [slideWidth, isReady]);

  useEffect(() => {
    if (containerWidth === 0 || slideWidth === 0 || !isReady) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        let nextIndex = prev + 1;
        // Si el usuario llega muy cerca del final, lo reiniciamos silenciosamente al centro
        if (nextIndex >= extendedSlides.length - slides.length) {
          nextIndex = START_INDEX;
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: nextIndex * slideWidth, y: 0, animated: false });
          }
          return nextIndex;
        }

        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: nextIndex * slideWidth, y: 0, animated: true });
        }
        return nextIndex;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [containerWidth, slideWidth, isReady]);

  const realIndex = activeIndex % slides.length;

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
            showsHorizontalScrollIndicator={false}
            snapToInterval={slideWidth}
            decelerationRate="fast"
            snapToAlignment="center"
            contentContainerStyle={{ paddingHorizontal: Math.max(0, padding), alignItems: 'stretch' }}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            style={{ width: containerWidth }}
          >
            {extendedSlides.map((slide, i) => (
              <View key={slide.uniqueId} style={{ width: slideWidth, paddingHorizontal: 10, justifyContent: 'center' }}>
                <View style={[styles.slideInner, { backgroundColor: slide.bg, borderColor: slide.color + '40', height: '100%' }, isMobile && styles.slideInnerMobile]}>
                  <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }, isMobile && styles.iconContainerMobile]}>
                    <MaterialCommunityIcons name={slide.icon} size={isMobile ? 36 : 42} color={slide.color} />
                  </View>
                  <View style={[styles.textContainer, isMobile && styles.textContainerMobile]}>
                    <Text style={[styles.title, { color: slide.color }, isMobile && styles.titleMobile]} selectable={false}>{slide.title}</Text>
                    <Text style={[styles.desc, isMobile && styles.descMobile]} selectable={false}>{slide.desc}</Text>
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
              realIndex === index ? styles.activeDot : styles.inactiveDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    marginTop: 0,
    marginBottom: 25,
    width: '100%',
  },
  slideInner: {
    width: '100%',
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
  slideInnerMobile: {
    flexDirection: 'column',
    padding: 20,
    justifyContent: 'center',
  },
  iconContainerMobile: {
    marginRight: 0,
    marginBottom: 12,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  textContainerMobile: {
    alignItems: 'center',
    flex: 0,
  },
  titleMobile: {
    fontSize: 18,
    textAlign: 'center',
  },
  descMobile: {
    fontSize: 12,
    textAlign: 'center',
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
